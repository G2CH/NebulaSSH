use std::fs;
use std::path::Path;
use serde::Serialize;
use std::time::SystemTime;

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

fn format_size(size: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut s = size as f64;
    let mut unit_idx = 0;
    while s >= 1024.0 && unit_idx < UNITS.len() - 1 {
        s /= 1024.0;
        unit_idx += 1;
    }
    format!("{:.1} {}", s, UNITS[unit_idx])
}

#[tauri::command]
pub fn list_local_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let path_obj = Path::new(&path);
    
    if !path_obj.exists() {
        return Err("Path does not exist".to_string());
    }
    
    if !path_obj.is_dir() {
        return Err("Path is not a directory".to_string());
    }
    
    let mut entries = Vec::new();
    
    let dir_entries = fs::read_dir(path_obj).map_err(|e| e.to_string())?;
    
    for entry in dir_entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let metadata = entry.metadata().map_err(|e| e.to_string())?;
        let filename = entry.file_name().to_string_lossy().to_string();
        
        let entry_type = if metadata.is_dir() { "directory" } else { "file" };
        let size = if metadata.is_file() {
            format_size(metadata.len())
        } else {
            "-".to_string()
        };
        
        let modified = metadata
            .modified()
            .ok()
            .and_then(|t| t.duration_since(SystemTime::UNIX_EPOCH).ok())
            .map(|d| {
                let dt = chrono::DateTime::from_timestamp(d.as_secs() as i64, 0).unwrap_or_default();
                dt.format("%Y-%m-%d %H:%M").to_string()
            })
            .unwrap_or_else(|| "-".to_string());
        
        #[cfg(unix)]
        use std::os::unix::fs::PermissionsExt;
        
        #[cfg(unix)]
        let permissions = format!("{:o}", metadata.permissions().mode() & 0o777);
        
        #[cfg(not(unix))]
        let permissions = if metadata.permissions().readonly() {
            "r--".to_string()
        } else {
            "rw-".to_string()
        };
        
        entries.push(FileEntry {
            name: filename,
            entry_type: entry_type.to_string(),
            size,
            last_modified: modified,
            permissions,
            owner: "".to_string(), // TODO: Get owner on Unix systems
            group: "".to_string(), // TODO: Get group on Unix systems
        });
    }
    
    // Sort: directories first, then files
    entries.sort_by(|a, b| {
        if a.entry_type == b.entry_type {
            a.name.cmp(&b.name)
        } else if a.entry_type == "directory" {
            std::cmp::Ordering::Less
        } else {
            std::cmp::Ordering::Greater
        }
    });
    
    Ok(entries)
}

#[tauri::command]
pub fn get_home_directory() -> Result<String, String> {
    dirs::home_dir()
        .and_then(|p| p.to_str().map(|s| s.to_string()))
        .ok_or_else(|| "Could not determine home directory".to_string())
}
