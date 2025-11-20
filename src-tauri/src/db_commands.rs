use crate::db::Database;
use crate::models::{AppSettings, CommandHistory, Server};
use crate::repositories::{history, servers, settings};
use tauri::State;

#[tauri::command]
pub fn get_servers(db: State<Database>) -> Result<Vec<Server>, String> {
    servers::get_all_servers(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_server(db: State<Database>, server: Server) -> Result<i64, String> {
    if let Some(_) = server.id {
        servers::update_server(&db, &server).map_err(|e| e.to_string())?;
        Ok(server.id.unwrap())
    } else {
        servers::create_server(&db, &server).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn delete_server(db: State<Database>, id: i64) -> Result<(), String> {
    servers::delete_server(&db, id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_command_log(db: State<Database>, server_id: Option<i64>, command: String) -> Result<i64, String> {
    history::save_command(&db, server_id, &command).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_command_history(
    db: State<Database>,
    server_id: Option<i64>,
    limit: Option<i32>,
) -> Result<Vec<CommandHistory>, String> {
    history::get_history(&db, server_id, limit.unwrap_or(100)).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_app_settings(db: State<Database>) -> Result<AppSettings, String> {
    settings::get_all_settings(&db).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_app_settings(db: State<Database>, settings: AppSettings) -> Result<(), String> {
    settings::update_settings(&db, &settings).map_err(|e| e.to_string())
}
