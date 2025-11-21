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
- 🔐 **Secure**: Local encrypted storage for connection details using SQLite

### File Management
- 📂 **SFTP Integration**: Built-in file browser with drag-and-drop upload/download support
- 📝 **Remote File Editor**: Edit remote files directly with syntax highlighting (powered by Monaco Editor)
- 🗂️ **File Icons**: Beautiful file-type icons for better visual organization

### Advanced Features
- 🪟 **Split Panes**: Split your terminal horizontally or vertically for multitasking (v0.2.0)
- 📊 **System Dashboard**: Real-time server monitoring (CPU, RAM, Disk, Network, Processes)
- 📋 **Snippet Manager**: Save and execute frequently used commands with one click
- 🤖 **AI Assistant**: Integrated AI helper for command generation and troubleshooting
- 🔗 **Port Forwarding**: Local and remote port forwarding support
- 🌉 **Jump Host**: Connect through bastion/jump hosts
- 🌐 **Internationalization**: Full support for English and Chinese (Simplified)

### Terminal Features
- 🎨 **Custom Themes**: Choose from Dracula, Nord, Solarized, GitHub Dark/Light, and more
- 📝 **Command History**: Track and search command history across sessions
- 🎯 **Context Menu**: Right-click context menu with split, AI, and copy/paste actions

## 🎬 Screenshots

<div align="center">
  <img src="screenshots/main.png" alt="Main Interface" width="800" />
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

- [ ] Session persistence across restarts
- [ ] Tab grouping and organization
- [ ] Custom keyboard shortcuts
- [ ] SSH key management UI
- [ ] Connection profiles and templates
- [ ] Tunneling and proxy support
- [ ] Multi-cursor support in editor
- [ ] Plugin system

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
