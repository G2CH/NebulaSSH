use rusqlite::{params, Result};
use serde::{Deserialize, Serialize};
use tauri::State;
use crate::db::Database;

#[derive(Debug, Serialize, Deserialize)]
pub struct Snippet {
    pub id: Option<i64>,
    pub name: String,
    pub command: String,
    pub category: String,
    pub description: Option<String>,
    pub created_at: i64,
}

#[tauri::command]
pub fn get_all_snippets(state: State<'_, Database>) -> Result<Vec<Snippet>, String> {
    state.query(|conn| {
        let mut stmt = conn
            .prepare("SELECT id, name, command, category, description, created_at FROM snippets ORDER BY category, name")?;

        let snippets_iter = stmt
            .query_map([], |row| {
                Ok(Snippet {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    command: row.get(2)?,
                    category: row.get(3)?,
                    description: row.get(4)?,
                    created_at: row.get(5)?,
                })
            })?;

        let mut snippets = Vec::new();
        for snippet in snippets_iter {
            snippets.push(snippet?);
        }

        Ok(snippets)
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_snippet(
    state: State<'_, Database>,
    name: String,
    command: String,
    category: String,
    description: Option<String>,
) -> Result<i64, String> {
    state.query(|conn| {
        let created_at = chrono::Utc::now().timestamp();

        conn.execute(
            "INSERT INTO snippets (name, command, category, description, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![name, command, category, description, created_at],
        )?;

        Ok(conn.last_insert_rowid())
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_snippet(
    state: State<'_, Database>,
    id: i64,
    name: String,
    command: String,
    category: String,
    description: Option<String>,
) -> Result<(), String> {
    state.query(|conn| {
        conn.execute(
            "UPDATE snippets SET name = ?1, command = ?2, category = ?3, description = ?4 WHERE id = ?5",
            params![name, command, category, description, id],
        )?;

        Ok(())
    }).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_snippet(state: State<'_, Database>, id: i64) -> Result<(), String> {
    state.query(|conn| {
        conn.execute("DELETE FROM snippets WHERE id = ?1", params![id])?;

        Ok(())
    }).map_err(|e| e.to_string())
}
