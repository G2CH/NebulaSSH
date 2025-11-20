# Nebula SSH

<div align="center">
  <img src="public/logo.png" alt="Nebula SSH Logo" width="120" height="120" />
  
  <h1>Nebula SSH</h1>
  
  <p>
    <strong>Next-generation SSH client built for performance and aesthetics.</strong>
  </p>

  <p>
    <a href="README_ZH.md">中文文档</a>
  </p>
</div>

---

## ✨ Features

- 🚀 **High Performance**: Built with Rust and Tauri for minimal resource usage and native performance.
- 🎨 **Modern UI**: Beautiful, frameless design with glassmorphism effects and smooth animations.
- 💻 **Full-featured Terminal**: Powered by xterm.js, supporting custom themes, fonts, and local terminal sessions.
- 📂 **SFTP Integration**: Built-in file manager for seamless file uploads, downloads, and browsing.
- 📊 **System Dashboard**: Real-time server monitoring dashboard (CPU, RAM, Disk, Network, Processes).
- 📝 **Snippet Manager**: Save, organize, and quickly execute frequently used commands.
- 🤖 **AI Assistant**: Integrated AI helper for generating commands and troubleshooting (Powered by OpenAI/Compatible APIs).
- 🌐 **Internationalization**: Native support for English and Chinese (Simplified).
- 🔐 **Secure**: Local encrypted storage for connection details using SQLite.

## 🛠️ Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS, Lucide React
- **Backend**: Rust, Tauri 2.x
- **Database**: SQLite
- **Terminal**: xterm.js
- **State Management**: React Context + Hooks

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- Rust (latest stable)
- Tauri CLI

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/nebula-ssh.git
   cd nebula-ssh
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

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <p>Made with ❤️ by Nebula Team</p>
</div>
