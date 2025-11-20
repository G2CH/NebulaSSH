use serde::Serialize;
use sysinfo::{System, Disks};

#[derive(Serialize)]
pub struct LocalSystemStats {
    uptime: u64,
    cpu_usage: f32,
    cpu_model: String,
    cpu_cores: usize,
    mem_usage: f32,
    mem_total: u64,
    mem_total_gb: String,
    mem_free: u64,
    disk_usage: f32,
    disk_total: String,
    disk_used: String,
    net_rx: u64,
    net_tx: u64,
    processes: Vec<ProcessInfo>,
    os_version: String,
}

#[derive(Serialize)]
pub struct ProcessInfo {
    pid: String,
    user: String,
    cpu: String,
    mem: String,
    command: String,
}

fn format_bytes(bytes: u64) -> String {
    const UNITS: &[&str] = &["B", "KB", "MB", "GB", "TB"];
    let mut s = bytes as f64;
    let mut unit_idx = 0;
    while s >= 1024.0 && unit_idx < UNITS.len() - 1 {
        s /= 1024.0;
        unit_idx += 1;
    }
    format!("{:.1}{}", s, UNITS[unit_idx])
}

#[tauri::command]
pub fn get_local_system_stats() -> Result<LocalSystemStats, String> {
    let mut sys = System::new_all();
    sys.refresh_all();
    
    // Sleep briefly to get accurate CPU measurements
    std::thread::sleep(std::time::Duration::from_millis(200));
    sys.refresh_cpu_all();
    
    // CPU usage (global) - now accurate after second refresh
    let cpu_usage = sys.global_cpu_usage();
    
    // Memory
    let mem_total = sys.total_memory() / 1024 / 1024; // MB
    let mem_used = sys.used_memory() / 1024 / 1024; // MB
    let mem_usage = if mem_total > 0 {
        (mem_used as f32 / mem_total as f32) * 100.0
    } else {
        0.0
    };
    
    // Uptime
    let uptime = System::uptime();
    
    // Disk
    let disks = Disks::new_with_refreshed_list();
    let (disk_total, disk_used, disk_usage) = if let Some(disk) = disks.iter().next() {
        let total = disk.total_space();
        let available = disk.available_space();
        let used = total - available;
        let usage = if total > 0 {
            (used as f64 / total as f64) * 100.0
        } else {
            0.0
        };
        (format_bytes(total), format_bytes(used), usage as f32)
    } else {
        ("0B".to_string(), "0B".to_string(), 0.0)
    };
    
    // Processes (top 5 by CPU)
    let mut processes: Vec<_> = sys.processes().values().collect();
    processes.sort_by(|a, b| {
        b.cpu_usage().partial_cmp(&a.cpu_usage()).unwrap_or(std::cmp::Ordering::Equal)
    });
    
    let process_list: Vec<ProcessInfo> = processes.iter().take(5).map(|proc| {
        ProcessInfo {
            pid: proc.pid().to_string(),
            user: proc.user_id().map(|u| u.to_string()).unwrap_or_else(|| "".to_string()),
            cpu: format!("{:.1}", proc.cpu_usage()),
            mem: format!("{:.1}", (proc.memory() as f64 / sys.total_memory() as f64) * 100.0),
            command: proc.name().to_string_lossy().to_string(),
        }
    }).collect();
    
    // CPU info
    let cpus = sys.cpus();
    let cpu_model = if !cpus.is_empty() {
        cpus[0].brand().to_string()
    } else {
        "Unknown".to_string()
    };
    let cpu_cores = sys.cpus().len();
    
    // OS info
    let os_version = format!(
        "{} {}",
        System::name().unwrap_or_else(|| "Unknown".to_string()),
        System::os_version().unwrap_or_else(|| "".to_string())
    );
    
    // Format memory total in GB
    let mem_total_gb = format!("{:.1} GB", mem_total as f64 / 1024.0);
    
    Ok(LocalSystemStats {
        uptime,
        cpu_usage,
        cpu_model,
        cpu_cores,
        mem_usage,
        mem_total,
        mem_total_gb,
        mem_free: mem_total - mem_used,
        disk_usage,
        disk_total,
        disk_used,
        net_rx: 0, // TODO: Network stats
        net_tx: 0,
        processes: process_list,
        os_version,
    })
}
