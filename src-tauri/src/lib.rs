use tauri::Manager;

mod ssh;
mod local_term;
mod sftp;
mod monitor;
mod local_files;
mod local_monitor;
mod ssh_utils;
mod db;
mod models;
mod repositories;
mod db_commands;
mod ai_service;
mod ssh_test;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(ssh::SshState::new())
    .manage(local_term::LocalState::new())
    .manage(sftp::SftpState::new())
    .manage(monitor::MonitorState::new())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![
        ssh::connect_ssh,
        ssh::write_ssh,
        ssh::resize_ssh,
        ssh::disconnect_ssh,
        local_term::connect_local,
        local_term::write_local,
        local_term::resize_local,
        local_term::disconnect_local,
        sftp::init_sftp,
        sftp::list_directory,
        sftp::download_file,
        sftp::upload_file,
        monitor::get_system_stats,
        local_files::list_local_directory,
        local_files::get_home_directory,
        local_monitor::get_local_system_stats,
        ssh_utils::get_remote_home_directory,
        db_commands::get_servers,
        db_commands::save_server,
        db_commands::delete_server,
        db_commands::save_command_log,
        db_commands::get_command_history,
        db_commands::get_app_settings,
        db_commands::save_app_settings,
        repositories::snippets::get_all_snippets,
        repositories::snippets::create_snippet,
        repositories::snippets::update_snippet,
        repositories::snippets::delete_snippet,
        ai_service::chat_completion,
        ssh_test::test_ssh_connection,
    ])
    .setup(|app| {
      // Initialize database
      let db = db::Database::new(app.handle()).expect("Failed to initialize database");
      app.manage(db);

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
