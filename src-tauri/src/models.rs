use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Server {
    pub id: Option<i64>,
    pub name: String,
    pub host: String,
    pub port: i32,
    pub username: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub password: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub private_key_path: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tags: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CommandHistory {
    pub id: Option<i64>,
    pub server_id: Option<i64>,
    pub command: String,
    pub executed_at: i64,
}



#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppSettings {
    pub history_limit: i32,
    pub theme: String,
    pub app_theme: String,
    pub ai_provider: String,
    pub ai_api_key: Option<String>,
    pub ai_model: Option<String>,
    pub ai_base_url: Option<String>,
}

impl Default for AppSettings {
    fn default() -> Self {
        AppSettings {
            history_limit: 10000,
            theme: "default".to_string(),
            app_theme: "system".to_string(),
            ai_provider: "openai".to_string(),
            ai_api_key: None,
            ai_model: None,
            ai_base_url: None,
        }
    }
}
