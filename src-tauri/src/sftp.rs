use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::net::TcpStream;
use std::path::Path;
use ssh2::Session;
use serde::Serialize;
use std::fs::File;

use crate::ssh::SshState;

pub struct SftpState {
    pub sessions: Arc<Mutex<HashMap<String, Session>>>,
}

impl SftpState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[derive(Serialize)]
pub struct FileEntry {
    name: String,
    #[serde(rename = "type")]
    entry_type: String,
    size: String,
    #[serde(rename = "lastModified")]
    last_modified: String,
    permissions: String,
    owner: String,
    group: String,
}

#[tauri::command]
pub fn init_sftp(
    ssh_state: tauri::State<'_, SshState>,
    sftp_state: tauri::State<'_, SftpState>,
    id: String,
) -> Result<(), String> {
    println!("Init SFTP for session: {}", id);
    // Check if we already have an SFTP session
    if sftp_state.sessions.lock().unwrap().contains_key(&id) {
        println!("SFTP session already exists for {}", id);
        return Ok(());
    }

    // Get credentials from SshState
    let (host, port, username, password, private_key) = {
        let sessions = ssh_state.sessions.lock().unwrap();
        let conn = sessions.get(&id).ok_or("SSH session not found")?;
        (
            conn.host.clone(),
            conn.port,
            conn.username.clone(),
            conn.password.clone(),
            conn.private_key.clone(),
        )
    };

    // Connect
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

    sftp_state.sessions.lock().unwrap().insert(id, sess);
    Ok(())
}

fn format_size(size: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    if size == 0 {
        return "0 B".to_string();
    }
    let i = (size as f64).log10() as usize / 3; // This is a rough approx, log1000 is 3
    let _i = std::cmp::min(i, UNITS.len() - 1);
    // Better:
    let mut s = size as f64;
    let mut unit_idx = 0;
    while s >= 1024.0 && unit_idx < UNITS.len() - 1 {
        s /= 1024.0;
        unit_idx += 1;
    }
    format!("{:.1} {}", s, UNITS[unit_idx])
}

#[tauri::command]
pub fn list_directory(
    state: tauri::State<'_, SftpState>,
    id: String,
    path: String,
) -> Result<Vec<FileEntry>, String> {
    let sessions = state.sessions.lock().unwrap();
    let sess = sessions.get(&id).ok_or("SFTP session not found")?;
    
    let sftp = sess.sftp().map_err(|e| e.to_string())?;
    let path_path = Path::new(&path);
    let mut entries = Vec::new();

    let dir = sftp.readdir(path_path).map_err(|e| e.to_string())?;
    
    for (path_buf, stat) in dir {
        let name = path_buf.file_name().unwrap().to_string_lossy().to_string();
        if name == "." || name == ".." {
            continue;
        }
        
        let entry_type = if stat.is_dir() { "directory" } else { "file" };
        let size = format_size(stat.size.unwrap_or(0));
        let mtime = stat.mtime.unwrap_or(0);
        // Simple date formatting
        let datetime = chrono::DateTime::from_timestamp(mtime as i64, 0).unwrap_or_default();
        let last_modified = datetime.format("%Y-%m-%d %H:%M").to_string();
        
        // Permissions
        let mode = stat.perm.unwrap_or(0);
        let permissions = format!("{:o}", mode & 0o777);

        entries.push(FileEntry {
            name,
            entry_type: entry_type.to_string(),
            size,
            last_modified,
            permissions,
            owner: stat.uid.unwrap_or(0).to_string(),
            group: stat.gid.unwrap_or(0).to_string(),
        });
    }

    Ok(entries)
}

#[tauri::command]
pub fn download_file(
    state: tauri::State<'_, SftpState>,
    id: String,
    remote_path: String,
    local_path: String,
) -> Result<(), String> {
    let sessions = state.sessions.lock().unwrap();
    let sess = sessions.get(&id).ok_or("SFTP session not found")?;
    let sftp = sess.sftp().map_err(|e| e.to_string())?;

    let mut remote_file = sftp.open(Path::new(&remote_path)).map_err(|e| e.to_string())?;
    let mut local_file = File::create(local_path).map_err(|e| e.to_string())?;

    std::io::copy(&mut remote_file, &mut local_file).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn upload_file(
    state: tauri::State<'_, SftpState>,
    id: String,
    local_path: String,
    remote_path: String,
) -> Result<(), String> {
    let sessions = state.sessions.lock().unwrap();
    let sess = sessions.get(&id).ok_or("SFTP session not found")?;
    let sftp = sess.sftp().map_err(|e| e.to_string())?;

    let mut local_file = File::open(local_path).map_err(|e| e.to_string())?;
    let mut remote_file = sftp.create(Path::new(&remote_path)).map_err(|e| e.to_string())?;

    std::io::copy(&mut local_file, &mut remote_file).map_err(|e| e.to_string())?;

    Ok(())
}
