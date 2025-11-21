use crate::db::Database;
use crate::models::Server;
use rusqlite::Result;
use chrono::Utc;

pub fn create_server(db: &Database, server: &Server) -> Result<i64> {
    let now = Utc::now().timestamp();
    let tags_json = serde_json::to_string(&server.tags).unwrap_or_default();
    
    db.query(|conn| {
        conn.execute(
            "INSERT INTO servers (name, host, port, username, password, private_key_path, server_group, tags, color, created_at, updated_at, forwarding_rules, jump_host_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            rusqlite::params![
                server.name,
                server.host,
                server.port,
                server.username,
                server.password,
                server.private_key_path,
                server.group,
                tags_json,
                server.color,
                now,
                now,
                serde_json::to_string(&server.forwarding_rules).unwrap_or_default(),
                server.jump_host_id,
            ],
        )?;
        
        Ok(conn.last_insert_rowid())
    })
}

pub fn get_all_servers(db: &Database) -> Result<Vec<Server>> {
    db.query(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, host, port, username, password, private_key_path, server_group, tags, color, created_at, updated_at, forwarding_rules, jump_host_id
             FROM servers ORDER BY updated_at DESC",
        )?;
        
        let servers = stmt.query_map([], |row| {
            let tags_str: Option<String> = row.get(8)?;
            let tags = tags_str.and_then(|s| serde_json::from_str(&s).ok());

            Ok(Server {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                host: row.get(2)?,
                port: row.get(3)?,
                username: row.get(4)?,
                password: row.get(5)?,
                private_key_path: row.get(6)?,
                group: row.get(7)?,
                tags,
                color: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                forwarding_rules: row.get::<_, Option<String>>(12)?.and_then(|s| serde_json::from_str(&s).ok()),
                jump_host_id: row.get(13)?,
            })
        })?;
        
        servers.collect()
    })
}

#[allow(dead_code)]
pub fn get_server(db: &Database, id: i64) -> Result<Option<Server>> {
    db.query(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, name, host, port, username, password, private_key_path, server_group, tags, color, created_at, updated_at, forwarding_rules, jump_host_id
             FROM servers WHERE id = ?1",
        )?;
        
        let mut servers = stmt.query_map([id], |row| {
            let tags_str: Option<String> = row.get(8)?;
            let tags = tags_str.and_then(|s| serde_json::from_str(&s).ok());

            Ok(Server {
                id: Some(row.get(0)?),
                name: row.get(1)?,
                host: row.get(2)?,
                port: row.get(3)?,
                username: row.get(4)?,
                password: row.get(5)?,
                private_key_path: row.get(6)?,
                group: row.get(7)?,
                tags,
                color: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
                forwarding_rules: row.get::<_, Option<String>>(12)?.and_then(|s| serde_json::from_str(&s).ok()),
                jump_host_id: row.get(13)?,
            })
        })?;
        
        match servers.next() {
            Some(server) => Ok(Some(server?)),
            None => Ok(None),
        }
    })
}

pub fn update_server(db: &Database, server: &Server) -> Result<()> {
    let now = Utc::now().timestamp();
    let tags_json = serde_json::to_string(&server.tags).unwrap_or_default();
    
    db.query(|conn| {
        conn.execute(
            "UPDATE servers SET name = ?1, host = ?2, port = ?3, username = ?4, 
             password = ?5, private_key_path = ?6, server_group = ?7, tags = ?8, color = ?9, updated_at = ?10, forwarding_rules = ?12, jump_host_id = ?13 WHERE id = ?11",
            rusqlite::params![
                server.name,
                server.host,
                server.port,
                server.username,
                server.password,
                server.private_key_path,
                server.group,
                tags_json,
                server.color,
                now,
                server.id,
                serde_json::to_string(&server.forwarding_rules).unwrap_or_default(),
                server.jump_host_id,
            ],
        )?;
        
        Ok(())
    })
}

pub fn delete_server(db: &Database, id: i64) -> Result<()> {
    db.query(|conn| {
        conn.execute("DELETE FROM servers WHERE id = ?1", [id])?;
        Ok(())
    })
}
