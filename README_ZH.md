# Nebula SSH

<div align="center">
  <img src="public/logo.png" alt="Nebula SSH Logo" width="120" height="120" />
  
  <h1>Nebula SSH</h1>
  
  <p>
    <strong>专为性能和美学打造的下一代 SSH 客户端。</strong>
  </p>

  <p>
    <a href="README.md">English Documentation</a>
  </p>
</div>

---

## ✨ 功能特性

- 🚀 **极致性能**：基于 Rust 和 Tauri 构建，资源占用极低，启动速度飞快。
- 🎨 **现代设计**：精美的无边框窗口设计，支持深色/浅色主题切换，流畅的动画效果。
- 💻 **全功能终端**：基于 xterm.js 内核，支持自定义主题、字体，以及本地终端会话。
- 📂 **SFTP 文件管理**：集成的文件传输功能，支持拖拽上传、下载和文件浏览。
- 📊 **系统监控仪表盘**：实时可视化的服务器状态监控（CPU、内存、磁盘、网络、进程）。
- 📝 **快捷指令片段**：支持保存、分类和一键执行常用的 Shell 命令。
- 🤖 **AI 智能助手**：内置 AI 助手，帮助生成命令、解释脚本和排查故障（支持 OpenAI 及兼容接口）。
- 🌐 **多语言支持**：原生支持简体中文和英文界面。
- 🔐 **安全可靠**：使用 SQLite 本地加密存储连接信息，数据完全掌握在自己手中。

## 🛠️ 技术栈

- **前端**: React, TypeScript, Tailwind CSS, Lucide React
- **后端**: Rust, Tauri 2.x
- **数据库**: SQLite
- **终端内核**: xterm.js

## 🚀 快速开始

### 环境要求

- Node.js (v18+)
- Rust (最新稳定版)
- Tauri CLI

### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/yourusername/nebula-ssh.git
   cd nebula-ssh
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发模式**
   ```bash
   npm run tauri dev
   ```

4. **构建生产版本**
   ```bash
   npm run tauri build
   ```

## ❓ 常见问题

### macOS: "应用已损坏，无法打开"

这是 macOS 的安全机制（Gatekeeper）拦截了未签名的应用。解决方法如下：

1. 打开终端 (Terminal)。
2. 输入以下命令并回车（需要输入密码）：
   ```bash
   sudo xattr -r -d com.apple.quarantine /Applications/NebulaSSH.app
   ```
   *（请将 `/Applications/NebulaSSH.app` 替换为您实际的应用路径）*

## 📄 开源协议

本项目采用 MIT 协议 - 详情请参阅 [LICENSE](LICENSE) 文件。

---

<div align="center">
  <p>Made with ❤️ by Nebula Team</p>
</div>
