use rusqlite::{Connection, Result};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");
        
        std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
        
        let db_path = app_dir.join("nebula.db");
        let conn = Connection::open(db_path)?;
        
        let db = Database {
            conn: Mutex::new(conn),
        };
        
        db.init_schema()?;
        db.init_default_settings()?;
        
        Ok(db)
    }
    
    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // Servers table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS servers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                host TEXT NOT NULL,
                port INTEGER DEFAULT 22,
                username TEXT NOT NULL,
                password TEXT,
                private_key_path TEXT,
                server_group TEXT,
                tags TEXT,
                color TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL
            )",
            [],
        )?;

        // Migrations for existing databases
        // We ignore errors because the columns might already exist
        let _ = conn.execute("ALTER TABLE servers ADD COLUMN server_group TEXT", []);
        let _ = conn.execute("ALTER TABLE servers ADD COLUMN tags TEXT", []);
        let _ = conn.execute("ALTER TABLE servers ADD COLUMN color TEXT", []);
        let _ = conn.execute("ALTER TABLE servers ADD COLUMN forwarding_rules TEXT", []);
        let _ = conn.execute("ALTER TABLE servers ADD COLUMN jump_host_id INTEGER", []);
        
        // Command history table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS command_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                server_id INTEGER,
                command TEXT NOT NULL,
                executed_at INTEGER NOT NULL,
                FOREIGN KEY (server_id) REFERENCES servers(id) ON DELETE CASCADE
            )",
            [],
        )?;
        
        // Create index for faster queries
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_history_server_time 
             ON command_history(server_id, executed_at DESC)",
            [],
        )?;
        
        // Snippets table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS snippets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                command TEXT NOT NULL,
                category TEXT NOT NULL,
                description TEXT,
                created_at INTEGER NOT NULL
            )",
            [],
        )?;
        
        // Settings table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )",
            [],
        )?;
        
        Ok(())
    }
    
    fn init_default_settings(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // Insert default settings if they don't exist
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES ('history_limit', '10000')",
            [],
        )?;
        
        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES ('theme', 'default')",
            [],
        )?;

        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES ('ai_provider', 'openai')",
            [],
        )?;

        conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES ('app_theme', 'system')",
            [],
        )?;
        
        Ok(())
    }
    
    pub fn get_connection(&self) -> std::sync::MutexGuard<'_, Connection> {
        self.conn.lock().unwrap()
    }
}
