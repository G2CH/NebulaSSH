use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, State};
use crate::repositories::settings::get_all_settings;
use crate::db::Database;
use futures_util::StreamExt;

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIStreamDelta {
    content: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIStreamChoice {
    delta: OpenAIStreamDelta,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIStreamResponse {
    choices: Vec<OpenAIStreamChoice>,
}

#[tauri::command]
pub async fn chat_completion(
    app_handle: AppHandle,
    state: State<'_, Database>,
    messages: Vec<ChatMessage>,
) -> Result<(), String> {
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
        "stream": true
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
        let error_msg = format!("API Error: {}", error_text);
        app_handle.emit("ai_response_error", &error_msg).unwrap_or_default();
        return Err(error_msg);
    }

    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        match item {
            Ok(chunk) => {
                let chunk_str = String::from_utf8_lossy(&chunk);
                for line in chunk_str.lines() {
                    let line = line.trim();
                    if line.starts_with("data: ") {
                        let data = &line[6..];
                        if data == "[DONE]" {
                            break;
                        }

                        if let Ok(response) = serde_json::from_str::<OpenAIStreamResponse>(data) {
                            if let Some(choice) = response.choices.first() {
                                if let Some(content) = &choice.delta.content {
                                    app_handle.emit("ai_response_chunk", content).unwrap_or_default();
                                }
                            }
                        }
                    }
                }
            }
            Err(e) => {
                let error_msg = format!("Stream error: {}", e);
                app_handle.emit("ai_response_error", &error_msg).unwrap_or_default();
                return Err(error_msg);
            }
        }
    }

    app_handle.emit("ai_response_done", ()).unwrap_or_default();
    Ok(())
}
