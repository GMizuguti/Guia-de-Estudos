use tauri::Manager;

/// Devolve um pequeno resumo do conteúdo empacotado.
/// Útil para conferir, pela interface, que o aplicativo nativo responde.
#[tauri::command]
fn app_info() -> serde_json::Value {
    serde_json::json!({
        "name": "{{TITULO_COMPLETO}}",
        "version": env!("CARGO_PKG_VERSION"),
        "offline": true
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![app_info])
        .setup(|app| {
            // A janela é criada oculta na configuração e exibida aqui,
            // quando o webview já pintou: evita o clarão branco na abertura.
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("erro ao iniciar o aplicativo Tauri");
}
