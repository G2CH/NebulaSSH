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
    
    // Ensure session exists (same connection logic as before)
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
        match run_command(sess, cmd) {
            Ok(output) => {
                println!("DEBUG: Command executed. Output length: {}", output.len());
                if output.is_empty() {
                    println!("DEBUG: Output is empty!");
                } else {
                    // println!("DEBUG: Output start: {}", &output[..std::cmp::min(output.len(), 100)]);
                }
                output
            },
            Err(e) => {
                println!("Command failed: {} - Error: {}", cmd.lines().next().unwrap_or(""), e);
                String::new()
            }
        }
    };

    // 1. Detect OS (Fast single command)
    let uname = run_safe("uname -s");
    let is_mac = uname.contains("Darwin");

    // 2. Construct ONE big command to fetch everything
    // Wrap in (...) 2>&1 to capture stderr in the output for debugging
    let cmd_inner = if is_mac {
        "echo '---UPTIME---'; sysctl -n kern.boottime; echo '---MEM---'; sysctl -n hw.memsize; echo '---DISK---'; df -h /; echo '---CPU---'; top -l 1 | grep 'CPU usage'; echo '---PROC---'; ps aux -r | head -6 | tail -5; echo '---OS---'; sw_vers -productVersion; echo '---MODEL---'; sysctl -n machdep.cpu.brand_string; echo '---CORES---'; sysctl -n hw.ncpu;"
    } else {
        "echo '---UPTIME---'; cat /proc/uptime; echo '---MEM---'; free -m; echo '---DISK---'; df -h /; echo '---CPU---'; top -bn1 | grep 'Cpu(s)'; echo '---PROC---'; ps aux --sort=-%cpu | head -6 | tail -5; echo '---OS---'; cat /etc/os-release | grep PRETTY_NAME | cut -d'\"' -f2; echo '---MODEL---'; cat /proc/cpuinfo | grep 'model name' | head -1 | cut -d':' -f2; echo '---CORES---'; nproc;"
    };

    let cmd = format!("(export TERM=xterm; {}) 2>&1", cmd_inner);

    let output = run_safe(&cmd);
    
    // Parse the output
    let mut uptime = 0;
    let mut mem_total = 0;
    let mut mem_used = 0;
    let mut mem_usage = 0.0;
    let mut disk_total = "0G".to_string();
    let mut disk_used = "0G".to_string();
    let mut disk_usage = 0.0;
    let mut cpu_usage = 0.0;
    let mut processes = Vec::new();
    let mut os_version = String::new();
    let mut cpu_model = String::new();
    let mut cpu_cores = 0;

    let parts: Vec<&str> = output.split("---").collect();
    // Expected format: ["", "UPTIME", "\n123\n", "MEM", "\n123\n", ...]
    // So we iterate starting from index 1, taking 2 items at a time (Key, Value)
    
    let mut i = 1;
    while i < parts.len().saturating_sub(1) {
        let key = parts[i].trim();
        let content = parts[i+1].trim();
        i += 2;

        // println!("DEBUG: Parsing Key: '{}'", key);

        match key {
            "UPTIME" => {
                if is_mac {
                    // Mac: { sec = 1731912345, usec = ... }
                    if let Some(start) = content.find("sec = ") {
                        let s = &content[start+6..];
                        if let Some(end) = s.find(',') {
                            if let Ok(boot_sec) = s[..end].parse::<u64>() {
                                let now = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs();
                                if now > boot_sec {
                                    uptime = now - boot_sec;
                                }
                            }
                        }
                    }
                } else {
                    // Linux: 12345.67 23456.78
                    uptime = content.split_whitespace().next().unwrap_or("0").parse::<f64>().unwrap_or(0.0) as u64;
                }
            },
            "MEM" => {
                if is_mac {
                    // Mac: just hw.memsize in bytes
                    mem_total = content.parse::<u64>().unwrap_or(0) / 1024 / 1024;
                } else {
                    // Linux: free -m output
                    for line in content.lines() {
                        if line.starts_with("Mem:") {
                            let p: Vec<&str> = line.split_whitespace().collect();
                            if p.len() >= 3 {
                                mem_total = p[1].parse().unwrap_or(0);
                                mem_used = p[2].parse().unwrap_or(0);
                                if mem_total > 0 {
                                    mem_usage = (mem_used as f32 / mem_total as f32) * 100.0;
                                }
                            }
                        }
                    }
                }
            },
            "DISK" => {
                for line in content.lines().skip(1) {
                    let p: Vec<&str> = line.split_whitespace().collect();
                    if p.len() >= 5 {
                        if p.last() == Some(&"/") || p.last() == Some(&"/System/Volumes/Data") {
                             disk_total = p[1].to_string();
                             disk_used = p[2].to_string();
                             let percent = p[4].trim_end_matches('%');
                             disk_usage = percent.parse().unwrap_or(0.0);
                             break;
                        }
                    }
                }
            },
            "CPU" => {
                if is_mac {
                    // CPU usage: 12.34% user, 5.67% sys, 81.99% idle
                    if let Some(idle_idx) = content.find(" idle") {
                        let s = &content[..idle_idx];
                        if let Some(last_space) = s.rfind(' ') {
                            let idle_val = s[last_space+1..].trim_end_matches('%').parse::<f32>().unwrap_or(100.0);
                            cpu_usage = 100.0 - idle_val;
                        }
                    }
                } else {
                    // %Cpu(s):  0.3 us,  0.2 sy,  0.0 ni, 99.5 id, ...
                    if let Some(idle_part) = content.split(',').find(|s| s.contains("id")) {
                         let idle_val: f32 = idle_part.trim().split_whitespace().next().unwrap_or("0").parse().unwrap_or(100.0);
                         cpu_usage = 100.0 - idle_val;
                    }
                }
            },
            "PROC" => {
                for line in content.lines().skip(0) {
                    let p: Vec<&str> = line.split_whitespace().collect();
                    if p.len() >= 11 {
                        processes.push(ProcessInfo {
                            pid: p.get(1).unwrap_or(&"").to_string(),
                            user: p.get(0).unwrap_or(&"").to_string(),
                            cpu: p.get(2).unwrap_or(&"0").to_string(),
                            mem: p.get(3).unwrap_or(&"0").to_string(),
                            command: p[10..].join(" "),
                        });
                    }
                }
            },
            "OS" => {
                if is_mac {
                    os_version = format!("macOS {}", content.trim());
                } else {
                    os_version = content.trim().to_string();
                    if os_version.is_empty() {
                        os_version = format!("Linux {}", uname.trim());
                    }
                }
            },
            "MODEL" => {
                cpu_model = content.trim().to_string();
            },
            "CORES" => {
                cpu_cores = content.trim().parse().unwrap_or(0);
            },
            _ => {}
        }
    }

    let mem_total_gb = format!("{:.1} GB", mem_total as f64 / 1024.0);

    Ok(SystemStats {
        uptime,
        cpu_usage,
        mem_usage,
        mem_total,
        mem_free: mem_total.saturating_sub(mem_used),
        disk_usage,
        disk_total,
        disk_used,
        net_rx: 0,
        net_tx: 0,
        processes,
        os_version,
        cpu_model,
        cpu_cores,
        mem_total_gb,
    })
}
