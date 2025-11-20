use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::State;
use crate::repositories::settings::get_all_settings;
use crate::db::Database;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}



#[derive(Debug, Serialize, Deserialize)]
struct OpenAIChoice {
    message: ChatMessage,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

#[tauri::command]
pub async fn chat_completion(
    state: State<'_, Database>,
    messages: Vec<ChatMessage>,
) -> Result<String, String> {
    // Fetch settings directly from DB to get latest config
    let settings = get_all_settings(&state).map_err(|e| e.to_string())?;

    let api_key = settings.ai_api_key.ok_or("AI API Key not configured")?;
    let base_url = settings.ai_base_url.unwrap_or_else(|| "https://api.openai.com/v1".to_string());
    let model = settings.ai_model.unwrap_or_else(|| "gpt-3.5-turbo".to_string());

    let client = reqwest::Client::new();
    let url = format!("{}/chat/completions", base_url.trim_end_matches('/'));

    let request_body = json!({
        "model": model,
        "messages": messages,
    });

    let res = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    if !res.status().is_success() {
        let error_text = res.text().await.unwrap_or_default();
        return Err(format!("API Error: {}", error_text));
    }

    let response_body: OpenAIResponse = res
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    if let Some(choice) = response_body.choices.first() {
        Ok(choice.message.content.clone())
    } else {
        Err("No response content".to_string())
    }
}
