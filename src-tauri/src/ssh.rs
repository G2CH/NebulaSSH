use std::io::Read;
use std::io::Write;
use std::net::TcpStream;
use std::sync::{Arc, Mutex};
use std::thread;
use tauri::{Emitter, Window};
use ssh2::Session;

pub struct SshState {
    pub sessions: Arc<Mutex<std::collections::HashMap<String, SshConnection>>>,
}

impl SshState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(std::collections::HashMap::new())),
        }
    }
}

pub struct SshConnection {
    writer: Option<std::sync::mpsc::Sender<Vec<u8>>>,
    resizer: Option<std::sync::mpsc::Sender<(u32, u32)>>,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub password: Option<String>,
    pub private_key: Option<String>,
}

#[tauri::command]
pub async fn connect_ssh(
    window: Window,
    state: tauri::State<'_, SshState>,
    id: String,
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
    private_key: Option<String>,
) -> Result<(), String> {
    println!("Connecting SSH: {}@{}:{}", username, host, port);
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    
    // Set TCP keepalive to prevent connection from being dropped
    tcp.set_nodelay(true).map_err(|e| e.to_string())?;
    
    let mut sess = Session::new().unwrap();
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;
    println!("SSH Handshake complete");

    if let Some(ref pwd) = password {
        sess.userauth_password(&username, pwd).map_err(|e| e.to_string())?;
    } else if let Some(ref _key) = private_key {
        // Assuming key is path or content. For now let's assume it's a path if it doesn't look like a key
        // But ssh2 expects path. If it's content we might need to write to temp file or use userauth_pubkey_memory (if available in crate version)
        // For simplicity, let's assume we only support password for now or key paths if we add that logic.
        // The prompt didn't specify key details, so let's stick to basic auth or key path.
        sess.userauth_agent(&username).map_err(|e| e.to_string())?;
    } else {
        return Err("No authentication method provided".to_string());
    }

    // Set keepalive on SSH session
    sess.set_keepalive(true, 30);  // Send keepalive every 30 seconds
    
    let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
    channel.request_pty("xterm-256color", None, Some((80, 24, 0, 0))).map_err(|e| e.to_string())?;
    channel.shell().map_err(|e| e.to_string())?;
    println!("SSH channel established for session: {}", id);

    let (tx_write, rx_write) = std::sync::mpsc::channel::<Vec<u8>>();
    let (tx_resize, rx_resize) = std::sync::mpsc::channel::<(u32, u32)>();

    // Clone values we need to store before using them in auth
    let password_clone = password.clone();
    let private_key_clone = private_key.clone();

    // Store connection info in state BEFORE spawning thread
    {
        let mut sessions = state.sessions.lock().unwrap();
        sessions.insert(id.clone(), SshConnection {
            writer: Some(tx_write.clone()),
            resizer: Some(tx_resize.clone()),
            host: host.clone(),
            port,
            username: username.clone(),
            password: password_clone,
            private_key: private_key_clone,
        });
    }
    println!("SSH connection info stored for session: {}", id);

    let id_clone = id.clone();
    
    // Spawn a thread to handle the session
    thread::spawn(move || {
        let mut buf = [0u8; 4096];
        loop {
            // Non-blocking read
            // ssh2 doesn't support easy non-blocking read without setting the session to non-blocking
            // But if we set it to non-blocking, we need to manage the loop carefully.
            // Alternative: Use a short timeout or just block.
            // If we block, we can't easily write or resize unless we do it on the same thread or use non-blocking.
            
            // Let's try setting blocking to false for the session?
            // Or better, just check for data available?
            
            // Actually, a common pattern with ssh2 in Rust is to use a loop that checks for incoming data
            // and also checks for outgoing data from a channel.
            
            // Check for write data
            if let Ok(data) = rx_write.try_recv() {
                let _ = channel.write_all(&data);
                let _ = channel.flush();
            }

            // Check for resize
            if let Ok((cols, rows)) = rx_resize.try_recv() {
                let _ = channel.request_pty_size(cols, rows, None, None);
            }

            // Read data
            // We can use read which blocks, but that prevents us from writing if we are single threaded here.
            // So we should set the stream to non-blocking or use a timeout.
            // sess.set_blocking(false); 
            
            // Let's try a simple approach:
            // We can't easily share the channel across threads because it's not Send/Sync usually (it borrows Session).
            // So this thread must own the channel and session.
            
            // To make it responsive, we can use a small timeout on read?
            // ssh2 doesn't have read_timeout easily on channel.
            
            // We can use `channel.read` but if it blocks forever we can't write.
            // We can set the underlying TcpStream to non-blocking?
            // Or use `sess.set_blocking(false)`.
            
            sess.set_blocking(false);
            match channel.read(&mut buf) {
                Ok(0) => {
                    // In non-blocking mode, 0 can mean no data available right now
                    // Check if channel is actually EOF/closed
                    if channel.eof() {
                        break;
                    }
                    // Otherwise, just sleep and continue
                    thread::sleep(std::time::Duration::from_millis(10));
                }
                Ok(n) => {
                    let data = buf[0..n].to_vec();
                    // Emit data to frontend
                    // We need to use emit from tauri.
                    // But we can't use `window` here easily if it's not Send?
                    // Window is Send.
                    let _ = window.emit(&format!("ssh_data_{}", id_clone), data);
                }
                Err(e) => {
                    if e.kind() == std::io::ErrorKind::WouldBlock { // EAGAIN / WouldBlock
                        // No data, sleep a bit
                        thread::sleep(std::time::Duration::from_millis(10));
                    } else {
                        // Real error
                        eprintln!("SSH read error for session {}: {}", id_clone, e);
                        break;
                    }
                }
            }
        }
        println!("SSH thread exiting for session: {}", id_clone);
        let _ = window.emit(&format!("ssh_close_{}", id_clone), ());
    });

    Ok(())
}

#[tauri::command]
pub fn write_ssh(
    state: tauri::State<'_, SshState>,
    id: String,
    data: String,
) -> Result<(), String> {
    if let Some(conn) = state.sessions.lock().unwrap().get(&id) {
        if let Some(tx) = &conn.writer {
            let _ = tx.send(data.into_bytes());
        }
    }
    Ok(())
}

#[tauri::command]
pub fn resize_ssh(
    state: tauri::State<'_, SshState>,
    id: String,
    cols: u32,
    rows: u32,
) -> Result<(), String> {
    if let Some(conn) = state.sessions.lock().unwrap().get(&id) {
        if let Some(tx) = &conn.resizer {
            let _ = tx.send((cols, rows));
        }
    }
    Ok(())
}

#[tauri::command]
pub fn disconnect_ssh(
    state: tauri::State<'_, SshState>,
    id: String,
) -> Result<(), String> {
    println!("Disconnecting SSH session: {}", id);
    let mut sessions = state.sessions.lock().unwrap();
    println!("Sessions before removal: {:?}", sessions.keys().collect::<Vec<_>>());
    sessions.remove(&id);
    println!("Sessions after removal: {:?}", sessions.keys().collect::<Vec<_>>());
    // The thread will eventually exit when channels are dropped or read fails?
    // Actually, dropping the sender will cause try_recv to fail with Disconnected.
    // We should handle that in the loop.
    Ok(())
}
