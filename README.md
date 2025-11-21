# Nebula SSH

<div align="center">
  <img src="public/logo.png" alt="Nebula SSH Logo" width="120" height="120" />
  
  <h1>Nebula SSH</h1>
  
  <p>
    <strong>Next-generation SSH client built for performance and aesthetics.</strong>
  </p>

  <p>
    <a href="README_ZH.md">中文文档</a> | 
    <a href="https://github.com/G2CH/NebulaSSH/releases">Download</a>
  </p>

  <p>
    <img src="https://img.shields.io/github/v/release/G2CH/NebulaSSH?style=flat-square" alt="Release" />
    <img src="https://img.shields.io/github/license/G2CH/NebulaSSH?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/Tauri-2.x-blue?style=flat-square" alt="Tauri" />
  </p>
</div>

---

## ✨ Features

### Core Features
- 🚀 **High Performance**: Built with Rust and Tauri for minimal resource usage and native performance
- 🎨 **Modern UI**: Beautiful, frameless design with glassmorphism effects and smooth animations
- 💻 **Full-featured Terminal**: Powered by xterm.js with custom themes, fonts, and local terminal support
- 🔐 **Secure by Design**: Local encrypted storage with master password protection and auto-lock

### Security & Privacy
- 🔒 **Master Password**: Set a master password to protect your sensitive connection data
- ⏱️ **Auto-lock**: Configurable idle timeout (5/10/15 minutes) or disable completely
- 🔐 **Database Encryption**: AES-256 encryption for SQLite database with Argon2 password hashing
- 🛡️ **Session Persistence**: Securely restore all sessions after restart
- 🔄 **Auto-reconnect**: Automatic reconnection after network interruptions

### File Management
- 📂 **SFTP Integration**: Built-in file browser with drag-and-drop upload/download support
- 📝 **Remote File Editor**: Edit remote files directly with syntax highlighting (powered by Monaco Editor)
- 🗂️ **File Icons**: Beautiful file-type icons for better visual organization

### Advanced Features
- 🪟 **Split Panes**: Split your terminal horizontally or vertically for multitasking
- 📊 **System Dashboard**: Real-time server monitoring (CPU, RAM, Disk, Network, Processes)
- 📋 **Snippet Manager**: Save and execute frequently used commands with one click
- 🤖 **AI Assistant**: Integrated AI helper for command generation and troubleshooting with context-aware suggestions
- 🔗 **Port Forwarding**: Local and remote port forwarding support
- 🌉 **Jump Host**: Connect through bastion/jump hosts
- 🌐 **Internationalization**: Full support for English and Chinese (Simplified)

### Terminal Features
- 🎨 **Custom Themes**: Choose from Dracula, Nord, Solarized, GitHub Dark/Light, and more
- 📝 **Command History**: Track and search command history across sessions
- 🎯 **Context Menu**: Right-click context menu with split, AI, and copy/paste actions
- ✨ **Enhanced UI Components**: Optimized Select dropdowns with size variants and better styling

## 🎬 Screenshots


<div align="center">
  <img src="screenshots/1.png" alt="main" width="800" />
  <p><em>Modern, clean interface with split panes</em></p>
  <img src="screenshots/2.png" alt="main" width="800" />
  <p><em>Modern, clean interface with split panes</em></p>
  <img src="screenshots/3.png" alt="main" width="800" />
  <p><em>Modern, clean interface with split panes</em></p>
  <img src="screenshots/4.png" alt="main" width="800" />
  <p><em>Modern, clean interface with split panes</em></p>
  <img src="screenshots/5.png" alt="main" width="800" />
  <p><em>Modern, clean interface with split panes</em></p>
</div>

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Rust, Tauri 2.x
- **Terminal**: xterm.js + FitAddon
- **Editor**: Monaco Editor (VS Code's editor)
- **Database**: SQLite with rusqlite
- **SSH**: ssh2 (Rust)
- **State Management**: React Context + Custom Hooks

## 🚀 Getting Started

### Download Pre-built Binaries

Download the latest release for your platform from the [Releases](https://github.com/G2CH/NebulaSSH/releases) page.

### Build from Source

#### Prerequisites

- Node.js (v18+)
- Rust (latest stable)
- Tauri CLI

#### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/G2CH/NebulaSSH.git
   cd NebulaSSH
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run in development mode**
   ```bash
   npm run tauri dev
   ```

4. **Build for production**
   ```bash
   npm run tauri build
   ```

## 📖 Usage Guide

### Connecting to a Server

1. Click the "New Connection" button in the sidebar
2. Enter your server details (host, port, username, password/key)
3. Click "Connect" to establish the SSH session

### Using Split Panes

- Right-click on the terminal and select "Split Vertical" or "Split Horizontal"
- Each pane maintains its own independent SSH session
- Close panes using the X button in the top-right corner (appears when multiple panes exist)

### File Management

1. Click the "Files" tab in the terminal view
2. Browse remote files, create folders, upload/download files
3. Double-click files to edit them in the built-in editor

### AI Assistant

1. Select text in the terminal
2. Right-click and choose "Ask AI", "Explain", or "Fix"
3. The AI modal will open with context-aware suggestions

## 🔧 Configuration

### AI Assistant Setup

Configure your AI provider in Settings:

1. Click the settings icon in the sidebar
2. Navigate to AI Settings
3. Enter your API key and endpoint
4. Supported providers: OpenAI, Azure OpenAI, or any OpenAI-compatible API

### Security Settings

Protect your sensitive connection data with these security features:

#### Master Password
1. On first launch, you'll be prompted to set a master password
2. This password is used to encrypt your database and unlock the application
3. Use a strong, memorable password - it cannot be recovered if forgotten

#### Auto-lock Configuration
1. Open Settings → Security
2. Toggle auto-lock on/off
3. When enabled, choose from:
   - **5 minutes**: Lock after 5 minutes of inactivity
   - **10 minutes**: Lock after 10 minutes of inactivity (default)
   - **15 minutes**: Lock after 15 minutes of inactivity
4. When disabled, the app will never auto-lock (master password still required on startup)

#### Database Encryption
- All connection data is encrypted using AES-256
- Passwords are hashed with Argon2 for maximum security
- Encryption key is derived from your master password

### Terminal Themes

Choose from built-in themes or customize your own:
- Default Dark
- Dracula
- Nord
- Solarized Dark/Light
- GitHub Dark/Light
- One Dark

## ❓ Troubleshooting

### macOS: "App is damaged and can't be opened"

This is a common issue on macOS when installing applications from unidentified developers:

1. Open Terminal
2. Run the following command:
   ```bash
   sudo xattr -r -d com.apple.quarantine /Applications/NebulaSSH.app
   ```
   *(Replace `/Applications/NebulaSSH.app` with the actual path to the app)*

### Linux: Missing Dependencies

On some Linux distributions, you may need to install additional dependencies:

```bash
# Debian/Ubuntu
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel gtk3-devel libappindicator-gtk3-devel

# Arch
sudo pacman -S webkit2gtk-4.1 gtk3 libappindicator-gtk3
```

## 🗺️ Roadmap

> **Product Positioning**: NebulaSSH is a professional standalone offline SSH client designed for enterprise intranet environments, focusing on performance, security, and efficiency.

### ✅ v0.3.0 - Session Management & Security (Completed)
**Core Focus**: Critical user experience and security improvements

- [x] **Session Persistence** - Restore all sessions after restart
- [x] **Auto-reconnect** - Automatic reconnection after disconnection
- [x] **Master Password** - Unlock app with master password at startup
- [x] **Auto-lock** - Configurable idle timeout (5/10/15 minutes, or disabled)
- [x] **Local Data Encryption** - Encrypt SQLite database for sensitive data
- [x] **AI Markdown Rendering** - Fixed AI response rendering with github-markdown-css
- [x] **Optimized Select Component** - Enhanced dropdown UI with size variants
- [x] **Context Menu Enhancements** - ANSI code stripping for clean AI context

### v0.4.0 - Batch Operations 🔥
**Core Focus**: Bulk server management for DevOps teams

- [ ] **Config Backup/Restore** - Export/import configuration as encrypted JSON
- [ ] **SSH Agent Forwarding** - Forward SSH agent to jump hosts
- [ ] **URL Click Support** - Cmd/Ctrl+Click to open URLs in browser
- [ ] **Broadcast Input** - Send commands to multiple servers simultaneously
- [ ] **Batch Script Execution** - Execute scripts on multiple machines at once
- [ ] **Result Aggregation** - Collect and compare output from multiple servers
- [ ] **Server Grouping** - Enhanced tree-structure organization
- [ ] **Color Tagging** - Visual organization with colors

### v0.5.0 - User Experience
**Core Focus**: Polish details and improve daily workflow

- [ ] **Custom Keyboard Shortcuts** - Fully configurable shortcuts
- [ ] **Workspace** - Save and restore window layouts and session sets
- [ ] **Tab Management** - Drag-and-drop, grouping, color marking
- [ ] **Global Search** - Quick search across servers and command history
- [ ] **Preset Shortcuts** - VS Code, Vim-style shortcut schemes

### v0.6.0 - AI Deep Integration🚀
**Core Focus**: AI-native features for competitive differentiation

- [ ] **AI Command Completion** - Real-time suggestions while typing
- [ ] **Natural Language to Command** - "Find largest files" → auto-execute
- [ ] **Smart Error Recovery** - Auto-suggest fixes for failed commands
- [ ] **Local AI Model Support** - Ollama integration for offline usage
- [ ] **AI Workflow Generator** - Record complex operations as scripts

### v1.0 - Production Ready
**Core Focus**: Stability, performance, and ecosystem

- [ ] **Performance Optimization** - Faster startup, lower memory usage
- [ ] **Stability** - Comprehensive error handling and crash recovery
- [ ] **Documentation** - Complete user manual and tutorials
- [ ] **Plugin System** - Allow community themes and extensions
- [ ] **Audit Logging** - Enterprise-grade operation logging

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) - Framework for building desktop applications
- [xterm.js](https://xtermjs.org/) - Terminal emulator for the web
- [ssh2](https://github.com/alexcrichton/ssh2-rs) - Rust SSH implementation
- [Lucide](https://lucide.dev/) - Beautiful icon library

---

<div align="center">
  <p>Made with ❤️ by <a href="https://github.com/G2CH">G2CH</a></p>
  <p>⭐ Star us on GitHub if you find this project useful!</p>
</div>
