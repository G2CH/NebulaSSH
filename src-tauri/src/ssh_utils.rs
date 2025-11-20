use std::io::Read;
use std::net::TcpStream;
use ssh2::Session;
use crate::ssh::SshState;

#[tauri::command]
pub fn get_remote_home_directory(
    ssh_state: tauri::State<'_, SshState>,
    id: String,
) -> Result<String, String> {
    println!("[get_remote_home_directory] Looking for session: {}", id);
    
    let (host, port, username, password, private_key) = {
        let ssh_sessions = ssh_state.sessions.lock().unwrap();
        println!("[get_remote_home_directory] Available sessions: {:?}", ssh_sessions.keys().collect::<Vec<_>>());
        let conn = ssh_sessions.get(&id).ok_or("SSH session not found")?;
        (
            conn.host.clone(),
            conn.port,
            conn.username.clone(),
            conn.password.clone(),
            conn.private_key.clone(),
        )
    };

    // Create a new SSH session to get home directory
    let tcp = TcpStream::connect(format!("{}:{}", host, port)).map_err(|e| e.to_string())?;
    let mut sess = Session::new().unwrap();
    sess.set_tcp_stream(tcp);
    sess.handshake().map_err(|e| e.to_string())?;

    if let Some(pwd) = password {
        sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
    } else if let Some(_key) = private_key {
        sess.userauth_agent(&username).map_err(|e| e.to_string())?;
    } else {
        return Err("No authentication method provided".to_string());
    }

    // Execute command to get home directory
    let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
    channel.exec("echo $HOME").map_err(|e| e.to_string())?;
    
    let mut output = String::new();
    channel.read_to_string(&mut output).map_err(|e| e.to_string())?;
    channel.wait_close().map_err(|e| e.to_string())?;

    let home_dir = output.trim().to_string();
    if home_dir.is_empty() || !home_dir.starts_with('/') {
        Ok("/".to_string())
    } else {
        Ok(home_dir)
    }
}
