use crate::db::Database;
use crate::models::AppSettings;
use rusqlite::Result;

pub fn get_setting(db: &Database, key: &str) -> Result<Option<String>> {
    db.query(|conn| {
        let result = conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            [key],
            |row| row.get(0),
        );
        
        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e),
        }
    })
}

pub fn set_setting(db: &Database, key: &str, value: &str) -> Result<()> {
    db.query(|conn| {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            [key, value],
        )?;
        Ok(())
    })
}

pub fn get_all_settings(db: &Database) -> Result<AppSettings> {
    let history_limit = get_setting(db, "history_limit")?
        .unwrap_or_else(|| "10000".to_string())
        .parse()
        .unwrap_or(10000);
    
    let theme = get_setting(db, "theme")?
        .unwrap_or_else(|| "default".to_string());

    let app_theme = get_setting(db, "app_theme")?
        .unwrap_or_else(|| "system".to_string());

    let ai_provider = get_setting(db, "ai_provider")?
        .unwrap_or_else(|| "openai".to_string());
    
    let ai_api_key = get_setting(db, "ai_api_key")?;
    let ai_model = get_setting(db, "ai_model")?;
    let ai_base_url = get_setting(db, "ai_base_url")?;
    
    let auto_reconnect = get_setting(db, "auto_reconnect")?
        .unwrap_or_else(|| "true".to_string())
        .parse()
        .unwrap_or(true);
        
    let lock_timeout = get_setting(db, "lock_timeout")?
        .unwrap_or_else(|| "0".to_string())
        .parse()
        .unwrap_or(0);
    
    Ok(AppSettings {
        history_limit,
        theme,
        app_theme,
        ai_provider,
        ai_api_key,
        ai_model,
        ai_base_url,
        auto_reconnect,
        lock_timeout,
    })
}

pub fn update_settings(db: &Database, settings: &AppSettings) -> Result<()> {
    set_setting(db, "history_limit", &settings.history_limit.to_string())?;
    set_setting(db, "theme", &settings.theme)?;
    set_setting(db, "app_theme", &settings.app_theme)?;
    set_setting(db, "ai_provider", &settings.ai_provider)?;
    set_setting(db, "auto_reconnect", &settings.auto_reconnect.to_string())?;
    set_setting(db, "lock_timeout", &settings.lock_timeout.to_string())?;
    
    if let Some(key) = &settings.ai_api_key {
        set_setting(db, "ai_api_key", key)?;
    }
    
    if let Some(model) = &settings.ai_model {
        set_setting(db, "ai_model", model)?;
    }
    
    if let Some(url) = &settings.ai_base_url {
        set_setting(db, "ai_base_url", url)?;
    }
    
    Ok(())
}
