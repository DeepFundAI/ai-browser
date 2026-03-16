# AI Browser

[English](./README.md) | [简体中文](./README.zh-CN.md)

An AI-powered intelligent browser built with Next.js and Electron. Features multi-modal AI task execution, scheduled tasks, social media integration, and advanced file management capabilities with support for multiple AI providers.

Built with [Next.js](https://nextjs.org) and [Electron](https://electronjs.org).

> **⚠️ Important Notes**
>
> - This project is for **learning purposes**. There may be bugs and issues - your understanding is appreciated.
> - **Windows users**: Building on Windows may require multiple attempts to succeed. If the build fails, try running the build command again.
> - **macOS recommended**: The macOS version provides a better user experience. Limited resources have been allocated to Windows optimization.

## Tech Stack

- **Frontend**: Next.js 15 + React 19
- **Desktop**: Electron 33
- **UI**: Ant Design + Tailwind CSS
- **State Management**: Zustand
- **Storage**: IndexedDB (via electron-store)
- **AI Agent**: @jarvis-agent (based on [Eko](https://github.com/FellouAI/eko) - production-ready agent framework)
- **Build Tools**: Vite + TypeScript

## Development Environment Configuration
Node version: 20.19.3

## Getting Started

### 1. Development Setup

First, run the development server:

```bash
# Install dependencies
pnpm install

# Build desktop application client for mac
pnpm run build:deps

# Build desktop application client for windows
pnpm run build:deps:win

# Start web development server
pnpm run next

# Start desktop application
pnpm run electron
```

### 2. Configure API Keys (After Launch)

After launching the application:

1. Click the **Settings** icon (⚙️) in the top-right corner
2. Navigate to **Providers** panel
3. Select your AI provider (DeepSeek, Qwen, Google Gemini, Claude, or OpenRouter)
4. Click **Edit API Key** and enter your API key
5. Click the checkmark to save

For detailed configuration instructions, see [CONFIGURATION.md](./docs/CONFIGURATION.md).

### 3. Building Desktop Application

To build the desktop application for distribution:

```bash
# Build the application for mac
pnpm run build

# Build the application for windows
pnpm run build:win
```

**Note**: End users will configure their API keys through the Settings UI after installation. No environment files needed.

## Features

- **Dual Mode Interaction**:
  - **Chat Mode** (default): Lightweight conversation with ChatAgent — streaming text, tool calls (web search, webpage QA), thinking display
  - **Deep Explore Mode**: Multi-step workflow generation → user confirm → multi-agent execution for complex tasks
- **Web Search Integration**: Built-in web search via Tavily, Serper, or SearXNG (self-hosted) with configurable search provider
- **Multiple AI Providers**: Support for DeepSeek, Qwen, Google Gemini, Anthropic Claude, and OpenRouter
- **Complete Settings System**: Configure everything through the UI - no file editing required
  - **Providers**: API keys, models, and provider-specific settings
  - **General**: Language, startup behavior, window preferences
  - **Chat**: Temperature, max tokens, streaming, search provider configuration
  - **Agent**: Browser/File/Custom agent settings, per-agent MCP services
  - **UI**: Theme (Dark/Light/System), font size, density, editor preferences
  - **Network**: Proxy, request timeout, stream timeout, retry attempts
- **Workflow Control**: Editable workflow steps with pause/resume, expert mode, and thinking display
- **Scheduled Tasks**: Create and manage automated recurring tasks with custom intervals
- **AI-Powered Browser**: Intelligent multi-tab browser with automated task execution
- **Multi-Modal AI**: Vision and text processing capabilities
- **Speech & TTS**: Voice recognition and text-to-speech integration
- **File Management**: Advanced file operations and management
- **Internationalization**: Full English and Chinese language support

## RoadMap

### ✅ Completed Features

**v0.0.1 - v0.0.4: Core Functionality**
- AI-powered browser with automated task execution
- Multiple AI provider support (DeepSeek, Qwen, Google Gemini, Claude, OpenRouter)
- Multi-modal AI capabilities (vision and text processing)
- Scheduled tasks system with custom intervals
- File management capabilities
- UI configuration for API keys and models

**v0.0.5 - v0.0.7: UI/UX Enhancements**
- Purple theme redesign with improved UI/UX
- Agent Configuration system (custom prompts, MCP tools management)
- Toolbox page (centralized feature hub)
- Internationalization support (English/Chinese)
- WebGL animated background with gradient fallback
- Improved modal sizes and layout optimization

**v0.0.8 - v0.0.10: Advanced Features**
- Human interaction support (AI can ask questions during execution)
- Task continuation with file attachment management
- Atomic fragment-based history playback with typewriter effects
- Advanced playback controls (play/pause/restart/speed adjustment)
- Context restoration and session management
- Optimized auto-scroll behavior for messages
- Enhanced message display and rendering

**v0.0.11+: Unified Settings System**
- Complete Settings redesign with 6 panels (Providers, General, Chat, Agent, UI, Network)
- Unified configuration management with electron-store
- All settings configurable through UI - no manual file editing required
- Real-time settings sync across all windows
- Import/Export/Reset functionality for all settings
- Dark/Light/System theme support with smooth transitions
- Network configuration (Proxy, Timeout, Retry)
- Scheduled Tasks system with IndexedDB storage

**v0.0.12+: Chat Mode & Agent Enhancement**
- Chat mode with ChatAgent (streaming text + inline tool calls)
- Deep Explore mode (renamed from workflow mode) for complex multi-step tasks
- Web search integration with 3 providers (Tavily, Serper, SearXNG)
- Webpage QA — extract and analyze content from open browser tabs
- Editable workflow steps with user confirmation before execution
- Task pause/resume support
- Expert mode with thinking process display
- Per-agent MCP service configuration
- Custom agent support with user-defined prompts
- Multi-window task isolation and global service injection

### 🚀 Future Plans

**Phase 1: Enhanced User Experience**
- Voice input support (speech-to-text integration)
- Theme customization system (multiple color schemes)
- Enhanced accessibility features

**Phase 2: Workflow Enhancement**
- Workflow configuration export/import functionality
- Refactored scheduled task steps based on workflow configuration
- Visual workflow editor with drag-and-drop interface
- Workflow templates and presets

**Phase 3: Plugin Ecosystem**
- MCP plugin marketplace
- Community plugin sharing platform
- Plugin version management system
- One-click plugin installation and updates
- Plugin development toolkit and documentation

**Phase 4: Advanced Capabilities**
- Collaborative task execution
- Cloud sync for tasks and configurations
- Mobile companion app
- Performance optimization and caching improvements

## Screenshots

### Start Loading
Animated splash screen on application launch.

![Start](./docs/shotscreen/start-loading.png)

### Home
Simple and clean interface - input your task and let AI execute automatically.

![Home](./docs/shotscreen/home.png)

### Task Execution
Left: AI thinking process and execution steps. Right: Real-time browser operation preview.

![Main](./docs/shotscreen/main.png)

### History
View past tasks with search functionality and playback capabilities.

![History](./docs/shotscreen/history.png)

### Settings
Comprehensive settings interface with 8 panels:
- **General**: Language, startup behavior, window preferences
- **Providers**: AI provider selection and API key management
- **Chat**: Temperature, max tokens, search provider configuration
- **Agent**: Browser/File/Custom agent settings, per-agent MCP services
- **Scheduled Tasks**: Create and manage automated tasks
- **User Interface**: Theme, font size, density preferences
- **Network**: Proxy, timeout, and retry configuration
- **Memory**: Context management settings (coming soon)

![Settings](./docs/shotscreen/settings.png)

## Supported AI Providers

- **DeepSeek**: deepseek-chat, deepseek-reasoner
- **Qwen (Alibaba Cloud)**: qwen-max, qwen-plus, qwen-vl-max
- **Google Gemini**: gemini-2.0-flash, gemini-2.5-pro, gemini-2.5-flash, and more
- **Anthropic Claude**: claude-sonnet-4-5, claude-3-7-sonnet, claude-3-5-sonnet, and more
- **OpenRouter**: Multiple providers (Claude, GPT, Gemini, Mistral, Cohere, etc.)

## Documentation

- [Configuration Guide](./docs/CONFIGURATION.md) - Detailed API key setup instructions
- [Testing Guide](./docs/TESTING.md) - E2E testing with Playwright

## Acknowledgements

Special thanks to [Eko](https://github.com/FellouAI/eko) - A production-ready agent framework that powers the AI capabilities of this project.

## Community and Support

⭐ If you find this project helpful, please consider giving it a star! Your support helps us grow and improve.

- Report issues on [GitHub Issues](https://github.com/DeepFundAI/ai-browser/issues)
- Join discussions and share feedback
- Contribute to make AI Browser better

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

**Important**: Never commit actual API keys to the repository. Use the Settings UI to configure your development environment.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.