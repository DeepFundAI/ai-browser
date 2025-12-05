# AI Browser

[English](./README.md) | [简体中文](./README.zh-CN.md)

一个基于 Next.js 和 Electron 构建的 AI 智能浏览器。支持多模态 AI 任务执行、定时任务、社交媒体集成以及高级文件管理功能，并支持多个 AI 提供商。

基于 [Next.js](https://nextjs.org) 和 [Electron](https://electronjs.org) 构建。

## 技术栈

- **前端**: Next.js 15 + React 19
- **桌面应用**: Electron 33
- **UI**: Ant Design + Tailwind CSS
- **状态管理**: Zustand
- **存储**: IndexedDB (via electron-store)
- **AI Agent**: @jarvis-agent (基于 [Eko](https://github.com/FellouAI/eko) - 生产就绪的 Agent 框架)
- **构建工具**: Vite + TypeScript

## 开发环境配置
Node 版本: 20.19.3

## 快速开始

### 1. 配置 API 密钥

运行应用前，需要配置 API 密钥：

```bash
# 复制配置模板
cp .env.template .env.local

# 编辑 .env.local 并填入你的 API 密钥
# 支持: DEEPSEEK_API_KEY, QWEN_API_KEY, GOOGLE_API_KEY, ANTHROPIC_API_KEY, OPENROUTER_API_KEY
```

详细配置说明请参见 [CONFIGURATION.zh-CN.md](./docs/CONFIGURATION.zh-CN.md)。

### 2. 开发环境设置

首先，运行开发服务器：

```bash
# 安装依赖
pnpm install

# 构建桌面应用客户端
pnpm run build:deps

# 启动 Web 开发服务器
pnpm run next

# 启动桌面应用
pnpm run electron
```

### 3. 构建桌面应用

构建用于分发的桌面应用：

```bash
# 配置生产环境 API 密钥
# 编辑 .env.production 文件并填入实际的 API 密钥

# 构建应用
pnpm run build
```

构建的应用将包含你的 API 配置，终端用户无需额外配置。

## 功能特性

- **多 AI 提供商支持**: 支持 DeepSeek、Qwen、Google Gemini、Anthropic Claude 和 OpenRouter
- **UI 配置**: 直接在应用中配置 AI 模型和 API 密钥，无需编辑文件
- **Agent 配置**: 使用自定义提示词定制 AI Agent 行为，管理 MCP 工具
- **工具箱**: 系统功能的集中访问中心，包括 Agent 配置、定时任务等
- **AI 智能浏览器**: 具有自动化任务执行的智能浏览器
- **多模态 AI**: 视觉和文本处理能力
- **定时任务**: 创建和管理自动化定期任务
- **语音识别与 TTS**: 语音识别和文字转语音集成
- **文件管理**: 高级文件操作和管理

## 产品路线图

### ✅ 已完成功能

**v0.0.1 - v0.0.4: 核心功能**
- AI 智能浏览器与自动化任务执行
- 多 AI 提供商支持（DeepSeek、Qwen、Google Gemini、Claude、OpenRouter）
- 多模态 AI 能力（视觉和文本处理）
- 定时任务系统（支持自定义执行间隔）
- 文件管理功能
- API 密钥和模型的 UI 配置

**v0.0.5 - v0.0.7: UI/UX 增强**
- 紫色主题重新设计，改进 UI/UX
- Agent 配置系统（自定义提示词、MCP 工具管理）
- 工具箱页面（功能集中访问中心）
- 国际化支持（中英文切换）
- WebGL 动画背景（带渐变降级方案）
- 优化模态框尺寸和布局

**v0.0.8 - v0.0.10: 高级功能**
- 人机交互支持（AI 执行过程中可主动提问）
- 任务续传与文件附件管理
- 基于原子片段的历史回放（支持打字机效果）
- 高级回放控制（播放/暂停/重启/速度调节）
- 上下文恢复与会话管理
- 消息自动滚动优化
- 增强的消息展示和渲染

### 🚀 未来规划

**阶段 1: 用户体验增强**
- 语音输入支持（语音转文字集成）
- 主题定制系统（多种配色方案）
- 深色/浅色模式切换
- 增强的无障碍功能

**阶段 2: 工作流增强**
- Workflow 配置的导出/导入功能
- 基于 Workflow 配置重构定时任务步骤结构
- 可视化工作流编辑器（支持拖拽）
- 步骤管理（重新排序、新增、删除、编辑工作流步骤）
- 工作流模板和预设

**阶段 3: 插件生态系统**
- MCP 插件市场
- 社区插件分享平台
- 插件版本管理系统
- 一键安装和更新插件
- 插件开发工具包和文档

**阶段 4: 高级能力**
- 多标签页浏览器支持
- 协作式任务执行
- 任务和配置的云端同步
- 移动端配套应用
- 性能优化和缓存改进

## 截图

### 启动动画

![启动动画](./docs/shotscreen/start-loading.png)

### 首页
输入任务，让 AI 自动执行。

![首页](./docs/shotscreen/home.png)

### 主界面
左侧：AI 思考和执行步骤。右侧：实时浏览器操作预览。

![主界面](./docs/shotscreen/main.png)

### 定时任务
创建具有自定义间隔和执行步骤的定时任务。

![定时任务](./docs/shotscreen/schedule.png)

### 历史记录
查看过去的任务，支持搜索和回放功能。

![历史记录](./docs/shotscreen/history.png)

### 工具箱
集中访问所有系统功能和配置的中心枢纽。

![工具箱](./docs/shotscreen/toolbox.png)

### Agent 配置
使用自定义提示词定制 AI Agent 行为，管理 MCP 工具以增强能力。

![Agent 配置](./docs/shotscreen/agent-configuration.png)

## 支持的 AI 提供商

- **DeepSeek**: deepseek-chat, deepseek-reasoner
- **Qwen (阿里云)**: qwen-max, qwen-plus, qwen-vl-max
- **Google Gemini**: gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro 等
- **Anthropic Claude**: claude-3.7-sonnet, claude-3.5-sonnet, claude-3-opus 等
- **OpenRouter**: 多个提供商（Claude、GPT、Gemini、Mistral、Cohere 等）

## 文档

- [配置指南](./docs/CONFIGURATION.zh-CN.md) - 详细的 API 密钥设置说明

## 致谢

特别感谢 [Eko](https://github.com/FellouAI/eko) - 一个生产就绪的 Agent 框架，为本项目提供了 AI 能力支持。

## 社区与支持

⭐ 如果你觉得这个项目有帮助，请考虑给它一个 star！你的支持帮助我们成长和改进。

- 在 [GitHub Issues](https://github.com/DeepFundAI/ai-browser/issues) 上报告问题
- 加入讨论并分享反馈
- 贡献代码让 AI Browser 变得更好

### Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=DeepFundAI/ai-browser&type=Date)](https://star-history.com/#DeepFundAI/ai-browser&Date)

## 贡献

请确保所有 API 密钥仅在开发环境文件中配置。永远不要将实际的 API 密钥提交到仓库中。

## 开源协议

本项目采用 MIT 协议开源 - 详见 [LICENSE](LICENSE) 文件。
