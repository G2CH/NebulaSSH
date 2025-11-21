use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSessionState {
    pub tabs: Vec<TabState>,
    pub active_tab_id: Option<String>,
    pub last_saved: i64,
    pub version: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TabState {
    pub id: String,
    pub name: String,
    pub layout: SplitNode,
    pub panes: Vec<PaneState>,
    pub active_pane_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SplitNode {
    pub id: Option<String>, // Added for frontend compatibility
    #[serde(rename = "type")]
    pub node_type: String, // "split" | "leaf"
    pub direction: Option<String>, // "horizontal" | "vertical"
    pub children: Option<Vec<SplitNode>>,
    pub pane_id: Option<String>,
    pub sizes: Option<Vec<f64>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaneState {
    pub id: String,
    pub session_id: String,
    pub server_id: String,
    pub current_directory: Option<String>,
    pub active_view: String, // "terminal" | "sftp" | "monitor" | "editor"
    pub editor_file: Option<String>,
}

impl AppSessionState {
    #[allow(dead_code)]
    pub fn new() -> Self {
        Self {
            tabs: Vec::new(),
            active_tab_id: None,
            last_saved: chrono::Utc::now().timestamp(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        }
    }
}

fn get_session_file_path() -> Result<PathBuf, String> {
    // Use dirs crate to get app data directory
    let app_dir = dirs::data_local_dir()
        .ok_or("Failed to get app data directory")?;
    
    let nebula_dir = app_dir.join("com.nebula.ssh");
    
    // Ensure directory exists
    if !nebula_dir.exists() {
        fs::create_dir_all(&nebula_dir).map_err(|e| e.to_string())?;
    }
    
    Ok(nebula_dir.join("session_state.json"))
}

#[tauri::command]
pub fn save_session_state(state: AppSessionState) -> Result<(), String> {
    let file_path = get_session_file_path()?;
    
    let mut state_to_save = state;
    state_to_save.last_saved = chrono::Utc::now().timestamp();
    
    let json = serde_json::to_string_pretty(&state_to_save)
        .map_err(|e| format!("Failed to serialize state: {}", e))?;
    
    fs::write(file_path, json)
        .map_err(|e| format!("Failed to write session state: {}", e))?;
    
    println!("Session state saved successfully");
    Ok(())
}

#[tauri::command]
pub fn load_session_state() -> Result<Option<AppSessionState>, String> {
    let file_path = get_session_file_path()?;
    
    if !file_path.exists() {
        println!("No session state file found");
        return Ok(None);
    }
    
    let json = fs::read_to_string(file_path)
        .map_err(|e| format!("Failed to read session state: {}", e))?;
    
    let state: AppSessionState = serde_json::from_str(&json)
        .map_err(|e| format!("Failed to deserialize state: {}", e))?;
    
    // Version compatibility check
    if state.version != env!("CARGO_PKG_VERSION") {
        println!("Warning: Session state version mismatch. Found: {}, Expected: {}", 
                 state.version, env!("CARGO_PKG_VERSION"));
        // For now, still load it, but in production we might want to migrate or skip
    }
    
    println!("Session state loaded successfully");
    Ok(Some(state))
}

#[tauri::command]
pub fn clear_session_state() -> Result<(), String> {
    let file_path = get_session_file_path()?;
    
    if file_path.exists() {
        fs::remove_file(file_path)
            .map_err(|e| format!("Failed to remove session state: {}", e))?;
        println!("Session state cleared");
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_session_state_creation() {
        let state = AppSessionState::new();
        assert_eq!(state.tabs.len(), 0);
        assert!(state.active_tab_id.is_none());
    }
}
