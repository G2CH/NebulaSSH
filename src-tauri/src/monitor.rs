use std::sync::{Arc, Mutex};
use std::collections::HashMap;
use std::io::Read;
use ssh2::Session;
use serde::Serialize;
use crate::ssh::SshState;

pub struct MonitorState {
    pub sessions: Arc<Mutex<HashMap<String, Session>>>,
}

impl MonitorState {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

#[derive(Serialize)]
pub struct SystemStats {
    uptime: u64,
    cpu_usage: f32,
    mem_usage: f32,
    mem_total: u64,
    mem_free: u64,
    disk_usage: f32,
    disk_total: String,
    disk_used: String,
    net_rx: u64,
    net_tx: u64,
    processes: Vec<ProcessInfo>,
    os_version: String,
    cpu_model: String,
    cpu_cores: u32,
    mem_total_gb: String,
}

#[derive(Serialize)]
pub struct ProcessInfo {
    pid: String,
    user: String,
    cpu: String,
    mem: String,
    command: String,
}

fn run_command(sess: &Session, cmd: &str) -> Result<String, String> {
    let mut channel = sess.channel_session().map_err(|e| e.to_string())?;
    channel.exec(cmd).map_err(|e| e.to_string())?;
    
    // Read with timeout to prevent deadlock
    let mut s = String::new();
    let mut buf = [0u8; 8192];
    let start = std::time::Instant::now();
    let timeout = std::time::Duration::from_secs(5);
    
    loop {
        if start.elapsed() > timeout {
            break;
        }
        
        match channel.read(&mut buf) {
            Ok(0) => break, // EOF
            Ok(n) => s.push_str(&String::from_utf8_lossy(&buf[0..n])),
            Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => {
                std::thread::sleep(std::time::Duration::from_millis(10));
                continue;
            }
            Err(_) => break,
        }
    }
    
    let _ = channel.wait_close();
    Ok(s)
}

#[tauri::command]
pub fn get_system_stats(
    ssh_state: tauri::State<'_, SshState>,
    monitor_state: tauri::State<'_, MonitorState>,
    id: String,
) -> Result<SystemStats, String> {
    let mut sessions = monitor_state.sessions.lock().unwrap();
    
    // Ensure session exists
    if !sessions.contains_key(&id) {
        let (host, port, username, password, private_key) = {
            let ssh_sessions = ssh_state.sessions.lock().unwrap();
            let conn = ssh_sessions.get(&id).ok_or("SSH session not found")?;
            (
                conn.host.clone(),
                conn.port,
                conn.username.clone(),
                conn.password.clone(),
                conn.private_key.clone(),
            )
        };

        // Create TCP connection with timeout
        let tcp = std::net::TcpStream::connect_timeout(
            &format!("{}:{}", host, port).parse().map_err(|e| format!("Invalid address: {}", e))?,
            std::time::Duration::from_secs(5)
        ).map_err(|e| format!("TCP connection failed: {}", e))?;
        
        tcp.set_read_timeout(Some(std::time::Duration::from_secs(5))).ok();
        tcp.set_write_timeout(Some(std::time::Duration::from_secs(5))).ok();
        
        let mut sess = Session::new().unwrap();
        sess.set_tcp_stream(tcp);
        sess.set_timeout(5000);
        sess.handshake().map_err(|e| format!("SSH handshake failed: {}", e))?;

        if let Some(pwd) = password {
            sess.userauth_password(&username, &pwd).map_err(|e| e.to_string())?;
        } else if let Some(_key) = private_key {
            sess.userauth_agent(&username).map_err(|e| e.to_string())?;
        } else {
            return Err("No authentication method provided".to_string());
        }
        
        sessions.insert(id.clone(), sess);
    }

    let sess = sessions.get(&id).unwrap();

    // Helper to run command safely
    let run_safe = |cmd: &str| -> String {
        run_command(sess, cmd).unwrap_or_default()
    };

    // Detect OS
    let uname = run_safe("uname -s");
    let is_mac = uname.contains("Darwin");

    // 1. Uptime
    let uptime = if is_mac {
        // Mac: sysctl -n kern.boottime (returns sec, usec) or uptime command
        // uptime: "16:08  up 1 day, 58 mins, 2 users, load averages: 1.66 1.83 1.79"
        let _out = run_safe("sysctl -n kern.boottime");
        // { sec = 1731912345, usec = ... }
        // Easier: just parse `uptime` command or return 0
        0 // TODO: Parse mac uptime
    } else {
        let out = run_safe("cat /proc/uptime"); 
        out.split_whitespace().next().unwrap_or("0").parse::<f64>().unwrap_or(0.0) as u64
    };

    // 2. Memory
    let (mem_total, mem_used, mem_usage) = if is_mac {
        // Mac: sysctl hw.memsize
        // vm_stat
        let total = run_safe("sysctl -n hw.memsize").trim().parse::<u64>().unwrap_or(0) / 1024 / 1024;
        (total, 0, 0.0) // TODO: Parse vm_stat
    } else {
        let out = run_safe("free -m");
        let mut total = 0;
        let mut used = 0;
        for line in out.lines() {
            if line.starts_with("Mem:") {
                let parts: Vec<&str> = line.split_whitespace().collect();
                if parts.len() >= 3 {
                    total = parts[1].parse().unwrap_or(0);
                    used = parts[2].parse().unwrap_or(0);
                }
            }
        }
        (total, used, if total > 0 { (used as f32 / total as f32) * 100.0 } else { 0.0 })
    };

    // 3. Disk
    let out = run_safe("df -h /");
    let mut disk_total = "0G".to_string();
    let mut disk_used = "0G".to_string();
    let mut disk_usage = 0.0;
    for line in out.lines().skip(1) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 5 {
            // Mac and Linux output for df -h is similar enough for the first line of /
            // Linux: /dev/sda1 20G 14G 5.4G 72% /
            // Mac:   /dev/disk1s1 466Gi 100Gi 366Gi 22% /
            // Parts indices might differ if filesystem name has spaces, but usually / is simple
            // Let's look for the line ending with /
            if parts.last() == Some(&"/") || parts.last() == Some(&"/System/Volumes/Data") { 
                 // Mac often mounts / read-only and data on /System/Volumes/Data
                 // But df -h / usually shows the root slice.
                 // Let's just take the first line that looks right.
                 if parts.len() >= 5 {
                     disk_total = parts[1].to_string();
                     disk_used = parts[2].to_string();
                     let percent = parts[4].trim_end_matches('%');
                     disk_usage = percent.parse().unwrap_or(0.0);
                     break;
                 }
            }
        }
    }

    // 4. Processes
    // Get processes (simplified, just top by CPU)
    let proc_lines = run_safe("ps aux --sort=-%cpu | head -6 | tail -5");
    let mut processes = Vec::new();
    for line in proc_lines.lines().skip(0) {
        let parts: Vec<&str> = line.split_whitespace().collect();
        if parts.len() >= 11 {
            processes.push(ProcessInfo {
                pid: parts.get(1).unwrap_or(&"").to_string(),
                user: parts.get(0).unwrap_or(&"").to_string(),
                cpu: parts.get(2).unwrap_or(&"0").to_string(),
                mem: parts.get(3).unwrap_or(&"0").to_string(),
                command: parts[10..].join(" "),
            });
        }
    }
    
    // 5. CPU Usage
    let cpu_usage = if is_mac {
        0.0 // TODO: top -l 1 | grep "CPU usage"
    } else {
        let out = run_safe("top -bn1 | grep 'Cpu(s)'");
        if let Some(idle_part) = out.split(',').find(|s| s.contains("id")) {
             let idle_val: f32 = idle_part.trim().split_whitespace().next().unwrap_or("0").parse().unwrap_or(100.0);
             100.0 - idle_val
        } else {
            0.0
        }
    };

    let net_rx = 0;
    let net_tx = 0;

    // Get system info
    let os_version = if is_mac {
        let sw_vers = run_safe("sw_vers -productVersion");
        format!("macOS {}", sw_vers.trim())
    } else {
        let os_release = run_safe("cat /etc/os-release | grep PRETTY_NAME | cut -d'\"' -f2");
        if !os_release.is_empty() {
            os_release.trim().to_string()
        } else {
            format!("Linux {}", uname.trim())
        }
    };

    let cpu_model = if is_mac {
        run_safe("sysctl -n machdep.cpu.brand_string").trim().to_string()
    } else {
        let model = run_safe("cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2");
        model.trim().to_string()
    };

    let cpu_cores = if is_mac {
        run_safe("sysctl -n hw.ncpu").trim().parse::<u32>().unwrap_or(0)
    } else {
        run_safe("nproc").trim().parse::<u32>().unwrap_or(0)
    };

    let mem_total_gb = format!("{:.1} GB", mem_total as f64 / 1024.0 / 1024.0);

    Ok(SystemStats {
        uptime,
        cpu_usage,
        mem_usage,
        mem_total,
        mem_free: mem_total - mem_used,
        disk_usage,
        disk_total,
        disk_used,
        net_rx,
        net_tx,
        processes,
        os_version,
        cpu_model,
        cpu_cores,
        mem_total_gb,
    })
}
