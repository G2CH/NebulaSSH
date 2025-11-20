use portable_pty::{CommandBuilder, native_pty_system, PtySize};
use std::sync::{Arc, Mutex};
use std::thread;
use std::io::{Read, Write};
use tauri::{Emitter, Window};

pub struct LocalState {
    pub sessions: Arc<Mutex<std::collections::HashMap<String, LocalSession>>>,
}

impl LocalState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(std::collections::HashMap::new())),
        }
    }
}

pub struct LocalSession {
    writer: Box<dyn Write + Send>,
    master: Box<dyn portable_pty::MasterPty + Send>,
    child: Box<dyn portable_pty::Child + Send>,
}

#[tauri::command]
pub fn connect_local(
    window: Window,
    state: tauri::State<'_, LocalState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    // Check if session already exists
    if state.sessions.lock().unwrap().contains_key(&id) {
        return Ok(());
    }

    let pty_system = native_pty_system();
    let pair = pty_system.openpty(PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    }).map_err(|e| e.to_string())?;

    let shell = if cfg!(target_os = "windows") { "powershell" } else { "/bin/zsh" };
    let mut cmd = CommandBuilder::new(shell);
    cmd.env("TERM", "xterm-256color");
    if let Ok(pwd) = std::env::current_dir() {
        cmd.env("PWD", pwd);
    }
    
    let child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;

    let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
    let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

    let id_clone = id.clone();
    thread::spawn(move || {
        let mut buf = [0u8; 1024];
        loop {
            match reader.read(&mut buf) {
                Ok(n) if n > 0 => {
                    let data = buf[0..n].to_vec();
                    let _ = window.emit(&format!("local_data_{}", id_clone), data);
                }
                Ok(_) => {
                    println!("Reader received EOF for session {}", id_clone);
                    break;
                }
                Err(e) => {
                    println!("Reader error for session {}: {}", id_clone, e);
                    break;
                }
            }
        }
        let _ = window.emit(&format!("local_close_{}", id_clone), ());
    });

    let session = LocalSession {
        writer,
        master: pair.master,
        child,
    };

    state.sessions.lock().unwrap().insert(id, session);

    Ok(())
}

#[tauri::command]
pub fn write_local(
    state: tauri::State<'_, LocalState>,
    id: String,
    data: String,
) -> Result<(), String> {
    if let Some(session) = state.sessions.lock().unwrap().get_mut(&id) {
        let _ = session.writer.write_all(data.as_bytes());
    }
    Ok(())
}

#[tauri::command]
pub fn resize_local(
    state: tauri::State<'_, LocalState>,
    id: String,
    cols: u16,
    rows: u16,
) -> Result<(), String> {
    if let Some(session) = state.sessions.lock().unwrap().get_mut(&id) {
        let _ = session.master.resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        });
    }
    Ok(())
}

#[tauri::command]
pub fn disconnect_local(
    state: tauri::State<'_, LocalState>,
    id: String,
) -> Result<(), String> {
    if let Some(mut session) = state.sessions.lock().unwrap().remove(&id) {
        let _ = session.child.kill();
    }
    Ok(())
}
