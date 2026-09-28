// Evita que uma janela de console abra junto com o app nas compilações de release do Windows.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    manual_lib::run()
}
