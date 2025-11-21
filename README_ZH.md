# Nebula SSH

<div align="center">
  <img src="public/logo.png" alt="Nebula SSH Logo" width="120" height="120" />
  
  <h1>Nebula SSH</h1>
  
  <p>
    <strong>专为性能和美学打造的下一代 SSH 客户端</strong>
  </p>

  <p>
    <a href="README.md">English Documentation</a> | 
    <a href="https://github.com/G2CH/NebulaSSH/releases">下载</a>
  </p>

  <p>
    <img src="https://img.shields.io/github/v/release/G2CH/NebulaSSH?style=flat-square" alt="Release" />
    <img src="https://img.shields.io/github/license/G2CH/NebulaSSH?style=flat-square" alt="License" />
    <img src="https://img.shields.io/badge/Tauri-2.x-blue?style=flat-square" alt="Tauri" />
  </p>
</div>

---

## ✨ 功能特性

### 核心功能
- 🚀 **极致性能**：基于 Rust 和 Tauri 构建，资源占用极低，启动速度飞快
- 🎨 **现代设计**：精美的无边框窗口设计，支持毛玻璃效果和流畅动画
- 💻 **全功能终端**：基于 xterm.js，支持自定义主题、字体和本地终端
- 🔐 **安全可靠**：使用 SQLite 本地加密存储连接信息

### 文件管理
- 📂 **SFTP 集成**：内置文件浏览器，支持拖拽上传下载
- 📝 **远程文件编辑**：直接编辑远程文件，支持语法高亮（Monaco Editor）
- 🗂️ **文件图标**：美观的文件类型图标，更好的视觉体验

### 高级功能
- 🪟 **分屏功能**：支持水平和垂直分屏，多任务并行（v0.2.0 新增）
- 📊 **系统监控**：实时监控服务器状态（CPU、内存、磁盘、网络、进程）
- 📋 **指令片段**：保存并一键执行常用命令
- 🤖 **AI 助手**：智能命令生成和故障排查
- 🔗 **端口转发**：支持本地和远程端口转发
- 🌉 **跳板机**：通过堡垒机/跳板机连接
- 🌐 **国际化**：完整支持简体中文和英文

### 终端功能
- 🎨 **自定义主题**：内置 Dracula、Nord、Solarized、GitHub 等主题
- 📝 **命令历史**：跨会话追踪和搜索命令历史
- 🎯 **右键菜单**：支持分屏、AI 辅助、复制粘贴等操作

## 🎬 截图展示

<div align="center">
  <img src="screenshots/1.png" alt="主界面" width="800" />
  <p><em>现代化、简洁的分屏界面</em></p>
  <img src="screenshots/2.png" alt="主界面" width="800" />
  <p><em>现代化、简洁的分屏界面</em></p>
  <img src="screenshots/3.png" alt="主界面" width="800" />
  <p><em>现代化、简洁的分屏界面</em></p>
  <img src="screenshots/4.png" alt="主界面" width="800" />
  <p><em>现代化、简洁的分屏界面</em></p>
  <img src="screenshots/5.png" alt="主界面" width="800" />
  <p><em>现代化、简洁的分屏界面</em></p>
</div>

## 🛠️ 技术栈

- **前端**: React 18, TypeScript, Tailwind CSS, Lucide React
- **后端**: Rust, Tauri 2.x
- **终端**: xterm.js + FitAddon
- **编辑器**: Monaco Editor（VS Code 编辑器内核）
- **数据库**: SQLite with rusqlite
- **SSH**: ssh2 (Rust)
- **状态管理**: React Context + 自定义 Hooks

## 🚀 快速开始

### 下载预编译版本

从 [Releases](https://github.com/G2CH/NebulaSSH/releases) 页面下载适合您平台的最新版本。

### 从源码编译

#### 环境要求

- Node.js (v18+)
- Rust (最新稳定版)
- Tauri CLI

#### 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/G2CH/NebulaSSH.git
   cd NebulaSSH
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

## 📖 使用指南

### 连接服务器

1. 点击侧边栏的"新建连接"按钮
2. 输入服务器信息（主机、端口、用户名、密码/密钥）
3. 点击"连接"建立 SSH 会话

### 使用分屏

- 在终端右键选择"垂直分屏"或"水平分屏"
- 每个窗格保持独立的 SSH 会话
- 当存在多个窗格时，使用右上角的 X 按钮关闭窗格

### 文件管理

1. 点击终端视图中的"文件"标签
2. 浏览远程文件、创建文件夹、上传下载文件
3. 双击文件可在内置编辑器中编辑

### AI 助手

1. 在终端中选择文本
2. 右键选择"询问 AI"、"解释"或"修复"
3. AI 对话框将打开并提供上下文感知的建议

## 🔧 配置说明

### AI 助手设置

在设置中配置您的 AI 提供商：

1. 点击侧边栏的设置图标
2. 导航到 AI 设置
3. 输入您的 API 密钥和端点
4. 支持的提供商：OpenAI、Azure OpenAI 或任何兼容 OpenAI 的 API

### 终端主题

从内置主题中选择或自定义您的主题：
- 默认深色
- Dracula
- Nord
- Solarized 深色/浅色
- GitHub 深色/浅色
- One Dark

## ❓ 常见问题

### macOS: "应用已损坏，无法打开"

这是 macOS 的安全机制（Gatekeeper）拦截了未签名的应用：

1. 打开终端
2. 运行以下命令：
   ```bash
   sudo xattr -r -d com.apple.quarantine /Applications/NebulaSSH.app
   ```
   *（请将 `/Applications/NebulaSSH.app` 替换为您实际的应用路径）*

### Linux: 缺少依赖

在某些 Linux 发行版上，您可能需要安装额外的依赖：

```bash
# Debian/Ubuntu
sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev

# Fedora
sudo dnf install webkit2gtk4.1-devel gtk3-devel libappindicator-gtk3-devel

# Arch
sudo pacman -S webkit2gtk-4.1 gtk3 libappindicator-gtk3
```

## 🗺️ 开发路线图

- [ ] 会话持久化（重启后恢复）
- [ ] 标签分组和组织
- [ ] 自定义键盘快捷键
- [ ] SSH 密钥管理界面
- [ ] 连接配置模板
- [ ] 隧道和代理支持
- [ ] 编辑器多光标支持
- [ ] 插件系统

## 🤝 贡献指南

欢迎贡献！请随时提交 Pull Request。

## 📄 开源协议

本项目采用 MIT 协议 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [Tauri](https://tauri.app/) - 桌面应用开发框架
- [xterm.js](https://xtermjs.org/) - 终端模拟器
- [ssh2](https://github.com/alexcrichton/ssh2-rs) - Rust SSH 实现
- [Lucide](https://lucide.dev/) - 美观的图标库

---

<div align="center">
  <p>用 ❤️ 制作 by <a href="https://github.com/G2CH">G2CH</a></p>
  <p>⭐ 如果这个项目对您有帮助，请在 GitHub 上给我们一个星标！</p>
</div>
