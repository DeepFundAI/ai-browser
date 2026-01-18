# 配置指南

本指南介绍如何通过设置界面配置 AI Browser。

## 🎯 推荐：设置界面（所有用户）

**现在所有配置都通过设置界面完成** - 无需手动编辑文件！

### 如何访问设置

1. 点击应用右上角的**设置**图标（⚙️）
2. 从 6 个配置面板中选择：
   - **Providers（提供商）**: AI 提供商选择、API 密钥和模型
   - **General（通用）**: 语言、启动行为、窗口偏好
   - **Chat（对话）**: 温度、最大令牌、流式传输和对话行为
   - **Agent（智能体）**: 浏览器/文件代理设置、自定义提示词、MCP 工具
   - **UI（界面）**: 主题（深色/浅色/跟随系统）、字体大小、密度、编辑器偏好
   - **Network（网络）**: 代理、请求超时、流超时、重试次数

### 设置界面的优势

✅ **无需编辑文件** - 通过用户友好的界面配置一切
✅ **实时更新** - 更改立即生效，无需重启
✅ **持久化存储** - 设置通过 electron-store 安全保存
✅ **导入/导出** - 备份和恢复你的配置
✅ **跨窗口同步** - 所有窗口立即反映更改

## 配置存储

- **设置位置**: `~/Library/Application Support/ai-browser/config.json` (macOS)
- **存储类型**: 加密的 electron-store
- **备份**: 使用设置界面的导出功能

## 替代方案：环境变量（仅供开发）

> ⚠️ **不推荐**：环境变量是遗留配置方式。请改用设置界面。

如果你是开发者且需要在开发期间使用环境变量：

1. 创建 `.env.local` 文件（参考 `.env.template`）
2. 添加你的 API 密钥
3. 重启开发服务器

**注意**：设置界面配置始终优先于环境变量。

## 支持的 AI 提供商

应用支持以下 AI 提供商：

| 提供商 | 模型 | 获取 API 密钥 |
|--------|------|--------------|
| **DeepSeek** | deepseek-chat, deepseek-reasoner | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **Qwen (阿里云)** | qwen-max, qwen-plus, qwen-vl-max | [bailian.console.aliyun.com](https://bailian.console.aliyun.com/) |
| **Google Gemini** | gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro 等 | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Anthropic Claude** | claude-3.7-sonnet, claude-3.5-sonnet, claude-3-opus 等 | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenRouter** | 多个提供商（Claude, GPT, Gemini 等） | [openrouter.ai](https://openrouter.ai/keys) |

## 完整设置指南

设置界面提供 8 个配置面板。以下是**已实现的功能**（基于实际代码库）：

### 1. General（通用）面板 ✅

配置语言、启动行为和窗口偏好。

**语言设置：**
- 在英文和中文之间切换
- 更改立即应用到所有窗口

**启动设置：**
- **开机自动启动**: 登录系统时自动启动
- **最小化启动**: 启动到系统托盘（仅在自动启动时生效）

**窗口行为：**
- **最小化到托盘**: 最小化时隐藏到系统托盘
- **关闭到托盘**: 关闭时保持在系统托盘运行

### 2. Providers（提供商）面板

配置 AI 提供商、API 密钥和选择模型。

**可用提供商：**
- DeepSeek（deepseek-chat、deepseek-reasoner）
- Qwen（qwen-max、qwen-plus、qwen-vl-max）
- Google Gemini（gemini-1.5-flash、gemini-2.0-flash 等）
- Anthropic Claude（claude-3.7-sonnet、claude-3.5-sonnet 等）
- OpenRouter（多个提供商）

**API 密钥获取地址：**
- DeepSeek: [platform.deepseek.com](https://platform.deepseek.com/api_keys)
- Qwen: [bailian.console.aliyun.com](https://bailian.console.aliyun.com/)
- Google Gemini: [aistudio.google.com](https://aistudio.google.com/app/apikey)
- Anthropic: [console.anthropic.com](https://console.anthropic.com/settings/keys)
- OpenRouter: [openrouter.ai](https://openrouter.ai/keys)

### 3. Chat（对话）面板 ✅

配置 AI 模型行为和对话参数。

**可用设置：**
- **Temperature（温度）** (0.0 - 2.0): 控制响应的创造性/随机性
- **Max Tokens（最大令牌）**: 最大响应长度（自动限制在模型上限内）
- **Show Token Usage（显示令牌使用）**: 显示每条响应的令牌消耗
- **Auto Save History（自动保存历史）**: 自动保存对话历史
- **History Retention Days（历史保留天数）**: 保存对话的天数（7-90 天）

### 4. Agent（智能体）面板 ✅

配置浏览器代理、文件代理和 MCP 工具。

**浏览器代理：**
- 启用/禁用自动浏览器控制
- 自定义浏览器代理系统提示词

**文件代理：**
- 启用/禁用文件系统操作
- 自定义文件代理系统提示词

**MCP 工具：**
- 查看和管理模型上下文协议工具
- 配置 MCP 服务器连接

### 5. Scheduled Tasks（定时任务）面板 ✅

创建和管理自动化定期任务。

**功能特性：**
- 创建包含多个执行步骤的任务
- 设置间隔调度（分钟/小时/天）
- 启用/禁用任务
- 查看执行历史
- 立即运行任务（按需执行）

**注意**: 定时任务使用独立的 IndexedDB 存储，不在统一设置中。

### 6. User Interface（用户界面）面板 ✅

配置主题、外观和编辑器偏好。

**可用设置：**
- **Theme（主题）**: 深色 / 浅色 / 跟随系统（跟随操作系统偏好）
- **Font Size（字体大小）**: 小 / 中 / 大
- **Density（密度）**: 紧凑 / 舒适 / 宽松
- **Show Line Numbers（显示行号）**: 在代码编辑器中显示行号
- **Word Wrap（自动换行）**: 在编辑器中启用自动换行

### 7. Network（网络）面板 ✅

配置代理、超时和重试行为。

**可用设置：**
- **Proxy（代理）**: HTTP/HTTPS/SOCKS5 代理配置
- **Request Timeout（请求超时）** (60-300秒): 首次响应超时
- **Stream Timeout（流超时）** (60-300秒): 流式令牌超时
- **Retry Attempts（重试次数）** (0-5): 失败时的重试次数

### 8. Memory（记忆）面板

上下文管理设置（即将推出）

**计划功能：**
- 对话记忆设置
- 上下文窗口管理
- 长期记忆配置

## 导入/导出设置

### 导出你的配置

1. 打开设置（⚙️）
2. 点击底部的**导出设置**按钮
3. 将 JSON 文件保存到你偏好的位置

### 导入配置

1. 打开设置（⚙️）
2. 点击底部的**导入设置**按钮
3. 选择之前导出的 JSON 文件
4. 确认导入

### 重置为默认值

1. 打开设置（⚙️）
2. 点击底部的**重置为默认值**按钮
3. 确认重置
4. 所有设置将恢复为出厂默认值

## 遗留：环境变量（仅供开发者）

> ⚠️ **已弃用**：此方法仅为向后兼容而保留。**请改用设置界面。**

如果你需要在开发期间使用环境变量（不推荐）：

```bash
# 复制模板
cp .env.template .env.local

# 使用你的 API 密钥编辑 .env.local
# 查看 .env.template 了解可用变量
```

**注意**：设置界面配置始终覆盖环境变量。

## 模型能力与令牌限制

不同模型有不同的最大令牌限制：

| 模型 | 提供商 | 最大令牌 | 最适合 |
|------|--------|---------|--------|
| deepseek-reasoner | DeepSeek | 65,536 | 复杂推理任务 |
| claude-3-7-sonnet | Anthropic | 128,000 | 长上下文任务 |
| gemini-2.0-flash-thinking | Google | 65,536 | 多模态推理 |
| deepseek-chat | DeepSeek | 8,192 | 通用任务 |
| qwen-max | Qwen | 8,192 | 中文任务 |
| claude-3.5-sonnet | Anthropic | 8,000 | 平衡性能 |

应用会根据你选择的模型自动配置正确的令牌限制。

## 安全与最佳实践

✅ **应该做：**
- 使用设置界面配置 API 密钥
- 定期导出设置作为备份
- 开发和生产使用不同的 API 密钥

❌ **不应该做：**
- 永远不要将实际 API 密钥提交到版本控制
- 不要分享你的导出设置文件（包含 API 密钥）
- 不要在源代码中硬编码 API 密钥

**安全功能：**
- API 密钥存储在加密的 electron-store 中
- 设置文件已从 git 中排除（`.gitignore`）
- 导入/导出使用安全的 JSON 格式

## 故障排除

### 设置界面问题

**问题**：找不到设置
- **解决方案**：点击应用右上角的 ⚙️ 图标

**问题**：更改未保存
- **解决方案**：
  - 确保点击了**保存**或**应用**按钮
  - 检查 `~/Library/Application Support/ai-browser/` 中的 electron-store 权限

**问题**：设置未在窗口间同步
- **解决方案**：
  - 关闭所有窗口并重启应用
  - 在开发者工具中检查错误消息（帮助 → 切换开发者工具）

### API 密钥问题

**问题**："API key is invalid" 错误
- **解决方案**：
  - 验证你复制了完整的 API 密钥（没有多余空格）
  - 检查 API 密钥在提供商控制台中是活跃的
  - 确保你有足够的额度/配额

**问题**："Cannot connect to API" 错误
- **解决方案**：
  - 检查你的互联网连接
  - 如果使用代理，验证网络面板中的代理设置
  - 验证 API 提供商的服务状态
  - 尝试不同的提供商以隔离问题

### 常见问题

- **模型不可用**：某些提供商有地区限制
- **速率限制**：你可能超过了 API 提供商的速率限制
- **代理不工作**：确保代理格式正确（例如 `http://127.0.0.1:7890`）
- **导入失败**：确保 JSON 文件来自有效的设置导出

### 获取帮助

如果遇到此处未涵盖的问题：

1. 查看 [GitHub Issues](https://github.com/DeepFundAI/ai-browser/issues) 页面
2. 打开开发者工具（帮助 → 切换开发者工具）检查错误
3. 创建新 Issue 并提供问题详情
