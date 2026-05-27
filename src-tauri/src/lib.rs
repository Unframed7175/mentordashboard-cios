// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod crypto; // Phase 12: AES-256-GCM encrypt/decrypt commands

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_os::init())                    // Phase 28: OS platform/version for feedback email
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_store::Builder::new().build()) // Phase 12: durable key-value persistence
        .plugin(tauri_plugin_secure_storage::init())        // Phase 12: OS keychain
        .invoke_handler(tauri::generate_handler![
            greet,
            crypto::encrypt_klassen, // Phase 12: AES-256-GCM encrypt
            crypto::decrypt_klassen, // Phase 12: AES-256-GCM decrypt
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
