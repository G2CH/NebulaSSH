use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{command, State};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier};
use argon2::password_hash::SaltString;
use rand::rngs::OsRng;
use crate::db::Database;
use rusqlite::Connection;

#[derive(Serialize, Deserialize, Debug)]
pub struct SecurityConfig {
    pub password_hash: String,
}

fn get_security_file_path() -> PathBuf {
    let mut path = dirs::data_local_dir().unwrap_or(PathBuf::from("."));
    path.push("nebula-ssh");
    std::fs::create_dir_all(&path).unwrap();
    path.push("security.json");
    path
}

// Derive a key from password for SQLCipher
fn derive_key(password: &str) -> Result<String, String> {
    use sha2::{Sha256, Digest};
    
    // Use SHA256 to derive a 256-bit key from the password
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    let result = hasher.finalize();
    
    // Convert to hex string
    let key = hex::encode(result);
    
    // Log for debugging (REMOVE IN PRODUCTION)
    eprintln!("Derived key length: {}", key.len());
    
    Ok(key)
}

#[command]
pub fn is_master_password_set() -> bool {
    get_security_file_path().exists()
}

#[command]
pub fn set_master_password(password: String) -> Result<(), String> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let password_hash = argon2.hash_password(password.as_bytes(), &salt)
        .map_err(|e| e.to_string())?
        .to_string();

    let config = SecurityConfig {
        password_hash,
    };

    let json = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(get_security_file_path(), json).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn verify_master_password(password: String) -> Result<bool, String> {
    let path = get_security_file_path();
    if !path.exists() {
        return Err("Master password not set".to_string());
    }

    let json = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let config: SecurityConfig = serde_json::from_str(&json).map_err(|e| e.to_string())?;

    let parsed_hash = PasswordHash::new(&config.password_hash)
        .map_err(|e| e.to_string())?;
    
    Ok(Argon2::default().verify_password(password.as_bytes(), &parsed_hash).is_ok())
}

#[command]
pub fn change_master_password(old_password: String, new_password: String) -> Result<(), String> {
    if !verify_master_password(old_password.clone())? {
        return Err("Incorrect old password".to_string());
    }
    set_master_password(new_password)
}

// Unified command for unlocking the app (verify password + unlock DB)
#[command]
pub fn unlock_app(password: String, db: State<Database>) -> Result<(), String> {
    // Verify password
    if !verify_master_password(password.clone())? {
        return Err("Incorrect password".to_string());
    }
    
    // Derive key and unlock database
    let key = derive_key(&password)?;
    db.unlock(key).map_err(|e| e.to_string())?;
    
    Ok(())
}

// Setup encryption for first-time setup or migration
#[command]
pub fn setup_encryption(password: String, db: State<Database>) -> Result<(), String> {
    eprintln!("setup_encryption called");
    
    // Check file size to determine if this is a real database with user data
    // or just an empty/newly created file
    let db_path = db.get_path();
    let should_migrate = if db_path.exists() {
        match std::fs::metadata(db_path) {
            Ok(metadata) => {
                let size = metadata.len();
                eprintln!("Database file size: {} bytes", size);
                // If file is larger than 100KB, assume it has user data
                size > 102400
            }
            Err(_) => false
        }
    } else {
        false
    };
    
    eprintln!("Should migrate existing database: {}", should_migrate);
    
    // Save password hash
    set_master_password(password.clone())?;
    
    // Derive key
    let key = derive_key(&password)?;
    
    if should_migrate {
        eprintln!("Migrating existing unencrypted database (file is large)");
        // Encrypt existing DB with real user data
        db.encrypt_existing(key).map_err(|e| e.to_string())?;
    } else {
        eprintln!("Creating new encrypted database");
        // For small files, try to open as encrypted first
        // Only delete if it's truly unencrypted/corrupted
        if db_path.exists() {
            eprintln!("Checking if existing file needs migration");
            // Try to open with the new key
            match Connection::open(db_path) {
                Ok(test_conn) => {
                    // Try to use the key
                    let test_key = format!("x'{}'", key);
                    match test_conn.pragma_update(None, "key", &test_key) {
                        Ok(_) => {
                            // Check if we can read from it
                            match test_conn.query_row("SELECT COUNT(*) FROM sqlite_master", [], |_| Ok(())) {
                                Ok(_) => {
                                    eprintln!("Database is already encrypted with this key, using it");
                                    // Database already encrypted, just unlock it
                                    drop(test_conn);
                                    db.unlock(key.clone()).map_err(|e| e.to_string())?;
                                    return Ok(());
                                }
                                Err(_) => {
                                    eprintln!("Database exists but cannot read, will recreate");
                                }
                            }
                        }
                        Err(_) => {
                            eprintln!("Cannot set key on existing database");
                        }
                    }
                }
                Err(_) => {
                    eprintln!("Cannot open existing database file");
                }
            }
            
            // If we reach here, the file needs to be deleted
            eprintln!("Removing existing small/corrupted database file");
            std::fs::remove_file(db_path).map_err(|e| e.to_string())?;
        }
        
        // Create new encrypted DB
        db.unlock(key).map_err(|e| e.to_string())?;
    }
    
    eprintln!("setup_encryption completed successfully");
    Ok(())
}
