use ssh2::Session;
use std::net::TcpStream;
use std::time::Duration;

#[tauri::command]
pub async fn test_ssh_connection(
    host: String,
    port: u16,
    username: String,
    password: Option<String>,
) -> Result<String, String> {
    // Attempt to connect
    let addr = format!("{}:{}", host, port);
    let tcp = TcpStream::connect_timeout(
        &addr.parse().map_err(|e| format!("Invalid address: {}", e))?,
        Duration::from_secs(5),
    )
    .map_err(|e| format!("Connection failed: {}", e))?;

    let mut sess = Session::new().map_err(|e| format!("Failed to create session: {}", e))?;
    sess.set_tcp_stream(tcp);
    sess.handshake()
        .map_err(|e| format!("SSH handshake failed: {}", e))?;

    // Try authentication
    if let Some(pass) = password {
        sess.userauth_password(&username, &pass)
            .map_err(|e| format!("Authentication failed: {}", e))?;
    } else {
        return Err("Password is required for testing".to_string());
    }

    if sess.authenticated() {
        Ok("Connection successful!".to_string())
    } else {
        Err("Authentication failed".to_string())
    }
}
