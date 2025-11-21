use rusqlite::{Connection, Result};
use std::sync::Mutex;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub struct Database {
    conn: Mutex<Option<Connection>>,
    path: PathBuf,
}

impl Database {
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = app_handle
            .path()
            .app_data_dir()
            .expect("Failed to get app data dir");
        
        std::fs::create_dir_all(&app_dir).expect("Failed to create app data dir");
        
        let db_path = app_dir.join("nebula.db");
        
        // We don't open the connection here anymore, or we open it lazily/on unlock
        // But to keep it simple, let's store the path and open on unlock/setup
        
        Ok(Database {
            conn: Mutex::new(None),
            path: db_path,
        })
    }



    pub fn unlock(&self, key: String) -> Result<()> {
        let mut conn_guard = self.conn.lock().unwrap();
        
        if conn_guard.is_some() {
            return Ok(()); // Already unlocked
        }

        eprintln!("Unlocking database at path: {:?}", self.path);
        let conn = Connection::open(&self.path)?;
        eprintln!("Connection opened successfully");
        
        // Set the key - SQLCipher expects x'...' format
        let formatted_key = format!("x'{}'", key);
        eprintln!("Setting PRAGMA key = {}", formatted_key);
        conn.pragma_update(None, "key", &formatted_key)?;
        
        // Set synchronous mode to FULL to ensure data is written to disk
        eprintln!("Setting PRAGMA synchronous = FULL");
        conn.pragma_update(None, "synchronous", "FULL")?;
        
        // Verify encryption by trying to read
        match conn.query_row("SELECT count(*) FROM sqlite_master", [], |_| Ok(())) {
            Ok(_) => {
                eprintln!("Database unlocked successfully");
                *conn_guard = Some(conn);
                // Release the lock before calling init methods
                drop(conn_guard);
                
                // Initialize schema now that we have access
                self.init_schema()?;
                self.init_default_settings()?;
                
                // Force write to disk by setting a pragma
                self.query(|conn| {
                    eprintln!("Forcing database file creation");
                    conn.pragma_update(None, "user_version", &1)?;
                    Ok(())
                })?;
                
                eprintln!("Database file created successfully");
                eprintln!("Database path: {:?}", self.path);
                Ok(())
            }
            Err(e) => {
                eprintln!("Failed to unlock database: {}", e);
                Err(rusqlite::Error::SqliteFailure(
                    rusqlite::ffi::Error::new(1),
                    Some(format!("Failed to unlock database: {}", e)),
                ))
            }
        }
    }

    pub fn encrypt_existing(&self, key: String) -> Result<()> {
        let mut conn_guard = self.conn.lock().unwrap();
        
        // Open without key (assumes unencrypted)
        let conn = Connection::open(&self.path)?;
        
        // Rekey (encrypt)
        let formatted_key = format!("x'{}'", key);
        eprintln!("Setting PRAGMA rekey = {}", formatted_key);
        conn.pragma_update(None, "rekey", &formatted_key)?;
        
        // Set synchronous mode to FULL
        eprintln!("Setting PRAGMA synchronous = FULL");
        conn.pragma_update(None, "synchronous", "FULL")?;
        
        *conn_guard = Some(conn);
        // Release the lock before calling init methods
        drop(conn_guard);
        
        self.init_schema()?;
        self.init_default_settings()?;
        
        Ok(())
    }
    
    // Helper to check if DB exists (for migration logic)
    pub fn exists(&self) -> bool {
        self.path.exists()
    }
    
    // Get database file path
    pub fn get_path(&self) -> &std::path::PathBuf {
        &self.path
    }
    
    // Force flush data to disk
    pub fn flush(&self) -> Result<()> {
        self.query(|conn| {
            eprintln!("Flushing database to disk");
            // Execute a checkpoint to force WAL data to main database
            conn.query_row("PRAGMA wal_checkpoint(FULL);", [], |_| Ok(()))?;
            eprintln!("Database flushed successfully");
            Ok(())
        })
    }
    
    // Check if database has any user data (to distinguish empty DB from migrated DB)
    pub fn has_data(&self) -> Result<bool> {
        if !self.path.exists() {
            return Ok(false);
        }
        
        // Try to open without encryption and check for user data
        match Connection::open(&self.path) {
            Ok(conn) => {
                // Check if servers table exists and has data
                match conn.query_row(
                    "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='servers'", 
                    [], 
                    |row| {
                        let count: i32 = row.get(0)?;
                        Ok(count > 0)
                    }
                ) {
                    Ok(has_servers_table) => {
                        if !has_servers_table {
                            eprintln!("No servers table found");
                            return Ok(false);
                        }
                        
                        // Check if servers table has any records
                        match conn.query_row("SELECT COUNT(*) FROM servers", [], |row| {
                            let count: i32 = row.get(0)?;
                            Ok(count > 0)
                        }) {
                            Ok(has_records) => {
                                eprintln!("Servers table has records: {}", has_records);
                                Ok(has_records)
                            },
                            Err(_) => {
                                eprintln!("Failed to query servers table");
                                Ok(false)
                            }
                        }
                    },
                    Err(_) => {
                        eprintln!("Failed to check for servers table");
                        Ok(false)
                    }
                }
            }
            Err(_) => {
                eprintln!("Failed to open database for data check");
                Ok(false)
            }
        }
    }

    fn init_schema(&self) -> Result<()> {
        let guard = self.conn.lock().unwrap();
        let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?; // Should be unlocked
        
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
        let guard = self.conn.lock().unwrap();
        let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

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
    
    // Helper for executing queries that handles the Option
    pub fn query<F, T>(&self, f: F) -> Result<T>
    where
        F: FnOnce(&Connection) -> Result<T>,
    {
        let guard = self.conn.lock().unwrap();
        let conn = guard.as_ref().ok_or(rusqlite::Error::SqliteFailure(
            rusqlite::ffi::Error::new(1), // SQLITE_ERROR
            Some("Database locked".to_string()),
        ))?;
        f(conn)
    }
}
