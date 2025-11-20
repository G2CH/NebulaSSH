use crate::db::Database;
use crate::models::CommandHistory;
use rusqlite::Result;
use chrono::Utc;

pub fn save_command(db: &Database, server_id: Option<i64>, command: &str) -> Result<i64> {
    let conn = db.get_connection();
    let now = Utc::now().timestamp();
    
    conn.execute(
        "INSERT INTO command_history (server_id, command, executed_at) VALUES (?1, ?2, ?3)",
        rusqlite::params![server_id, command, now],
    )?;
    
    // Auto-cleanup old history based on settings
    let history_limit: i32 = conn.query_row(
        "SELECT value FROM settings WHERE key = 'history_limit'",
        [],
        |row| row.get::<_, String>(0),
    )
    .unwrap_or_else(|_| "10000".to_string())
    .parse()
    .unwrap_or(10000);
    
    cleanup_old_history(&conn, history_limit)?;
    
    Ok(conn.last_insert_rowid())
}

pub fn get_history(db: &Database, server_id: Option<i64>, limit: i32) -> Result<Vec<CommandHistory>> {
    let conn = db.get_connection();
    
    let (query, params): (&str, Vec<rusqlite::types::Value>) = if let Some(sid) = server_id {
        (
            "SELECT id, server_id, command, executed_at FROM command_history 
             WHERE server_id = ?1 ORDER BY executed_at DESC LIMIT ?2",
            vec![sid.into(), limit.into()],
        )
    } else {
        (
            "SELECT id, server_id, command, executed_at FROM command_history 
             WHERE server_id IS NULL ORDER BY executed_at DESC LIMIT ?1",
            vec![limit.into()],
        )
    };
    
    let mut stmt = conn.prepare(query)?;
    
    let history = stmt.query_map(rusqlite::params_from_iter(params), |row| {
        Ok(CommandHistory {
            id: Some(row.get(0)?),
            server_id: row.get(1)?,
            command: row.get(2)?,
            executed_at: row.get(3)?,
        })
    })?;
    
    history.collect()
}

#[allow(dead_code)]
pub fn search_history(db: &Database, server_id: Option<i64>, query: &str, limit: i32) -> Result<Vec<CommandHistory>> {
    let conn = db.get_connection();
    let search_pattern = format!("%{}%", query);
    
    let (sql, params): (&str, Vec<rusqlite::types::Value>) = if let Some(sid) = server_id {
        (
            "SELECT id, server_id, command, executed_at FROM command_history 
             WHERE server_id = ?1 AND command LIKE ?2 ORDER BY executed_at DESC LIMIT ?3",
            vec![sid.into(), search_pattern.into(), limit.into()],
        )
    } else {
        (
            "SELECT id, server_id, command, executed_at FROM command_history 
             WHERE server_id IS NULL AND command LIKE ?1 ORDER BY executed_at DESC LIMIT ?2",
            vec![search_pattern.into(), limit.into()],
        )
    };
    
    let mut stmt = conn.prepare(sql)?;
    
    let history = stmt.query_map(rusqlite::params_from_iter(params), |row| {
        Ok(CommandHistory {
            id: Some(row.get(0)?),
            server_id: row.get(1)?,
            command: row.get(2)?,
            executed_at: row.get(3)?,
        })
    })?;
    
    history.collect()
}

pub fn cleanup_old_history(conn: &rusqlite::Connection, max_records: i32) -> Result<()> {
    // Keep only the most recent max_records
    conn.execute(
        "DELETE FROM command_history WHERE id NOT IN (
            SELECT id FROM command_history ORDER BY executed_at DESC LIMIT ?1
        )",
        [max_records],
    )?;
    
    Ok(())
}
