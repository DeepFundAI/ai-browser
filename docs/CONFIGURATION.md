# Configuration Guide

This guide explains how to configure AI Browser through the Settings interface.

## 🎯 Recommended: Settings UI (All Users)

**All configuration is now done through the Settings UI** - no manual file editing required!

### How to Access Settings

1. Click the **Settings** icon (⚙️) in the top-right corner of the application
2. Choose from 6 configuration panels:
   - **Providers**: AI provider selection, API keys, and models
   - **General**: Language, startup behavior, window preferences
   - **Chat**: Temperature, max tokens, streaming, and chat behavior
   - **Agent**: Browser/File agent settings, custom prompts, MCP tools
   - **UI**: Theme (Dark/Light/System), font size, density, editor preferences
   - **Network**: Proxy, request timeout, stream timeout, retry attempts

### Benefits of Settings UI

✅ **No file editing** - Configure everything through a user-friendly interface
✅ **Real-time updates** - Changes take effect immediately, no restart needed
✅ **Persistent storage** - Settings saved securely with electron-store
✅ **Import/Export** - Backup and restore your configuration
✅ **Cross-window sync** - All windows reflect changes instantly

## Configuration Storage

- **Settings Location**: `~/Library/Application Support/ai-browser/config.json` (macOS)
- **Storage Type**: Encrypted electron-store
- **Backup**: Use Export feature in Settings UI

## Alternative: Environment Variables (For Development Only)

> ⚠️ **Not Recommended**: Environment variables are legacy configuration. Use Settings UI instead.

If you're a developer and need to use environment variables during development:

1. Create `.env.local` file (see `.env.template` for reference)
2. Add your API keys
3. Restart the development server

**Note**: Settings UI configuration always takes priority over environment variables.

## Supported AI Providers

The application supports the following AI providers:

| Provider | Models | Get API Key |
|----------|--------|-------------|
| **DeepSeek** | deepseek-chat, deepseek-reasoner | [platform.deepseek.com](https://platform.deepseek.com/api_keys) |
| **Qwen (Alibaba)** | qwen-max, qwen-plus, qwen-vl-max | [bailian.console.aliyun.com](https://bailian.console.aliyun.com/) |
| **Google Gemini** | gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro, etc. | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| **Anthropic Claude** | claude-3.7-sonnet, claude-3.5-sonnet, claude-3-opus, etc. | [console.anthropic.com](https://console.anthropic.com/settings/keys) |
| **OpenRouter** | Multiple providers (Claude, GPT, Gemini, etc.) | [openrouter.ai](https://openrouter.ai/keys) |

## Complete Settings Guide

### 1. Providers Panel

Configure AI providers, API keys, and select models.

**How to configure:**

1. Open Settings (⚙️) → **Providers** tab
2. Browse the list of available providers:
   - DeepSeek (deepseek-chat, deepseek-reasoner)
   - Qwen (qwen-max, qwen-plus, qwen-vl-max)
   - Google Gemini (gemini-1.5-flash, gemini-2.0-flash, etc.)
   - Anthropic Claude (claude-3.7-sonnet, claude-3.5-sonnet, etc.)
   - OpenRouter (multiple providers aggregated)
3. Click **Edit API Key** for your chosen provider
4. Paste your API key and click the checkmark to save
5. Select your preferred model from the dropdown

**API Key Status Indicators:**
- 🟢 **Configured** - API key is set and ready to use
- 🟡 **Not Configured** - No API key found

**Where to get API keys:**
- DeepSeek: [platform.deepseek.com](https://platform.deepseek.com/api_keys)
- Qwen: [bailian.console.aliyun.com](https://bailian.console.aliyun.com/)
- Google Gemini: [aistudio.google.com](https://aistudio.google.com/app/apikey)
- Anthropic: [console.anthropic.com](https://console.anthropic.com/settings/keys)
- OpenRouter: [openrouter.ai](https://openrouter.ai/keys)

### 2. General Settings Panel

Configure language, startup behavior, and window preferences.

**Available options:**
- **Language**: English / 中文
- **Launch on Startup**: Auto-start on system boot
- **Close to Tray**: Minimize to system tray instead of quitting
- **Window Size**: Remember last window size and position

### 3. Chat Settings Panel

Configure AI model behavior and chat preferences.

**Available options:**
- **Temperature** (0.0 - 2.0): Control response randomness
- **Max Tokens**: Maximum response length (varies by model)
- **Streaming**: Enable real-time response streaming
- **Context Window**: Number of messages to include in context

### 4. Agent Settings Panel

Configure Browser Agent, File Agent, and MCP tools.

**Browser Agent:**
- Enable/disable automated browser control
- Customize browser agent prompt

**File Agent:**
- Enable/disable file system operations
- Customize file agent prompt

**MCP Tools:**
- View and manage Model Context Protocol tools
- Add custom MCP server configurations

### 5. UI Settings Panel

Configure theme, appearance, and editor preferences.

**Available options:**
- **Theme**: Dark / Light / System (follows OS)
- **Font Size**: Small / Medium / Large
- **Density**: Compact / Comfortable / Spacious
- **Editor Theme**: Monaco editor color scheme

### 6. Network Settings Panel

Configure proxy, timeouts, and retry behavior.

**Available options:**
- **Proxy**: HTTP/HTTPS/SOCKS5 proxy configuration
- **Request Timeout** (60-300s): First response timeout
- **Stream Timeout** (60-300s): Streaming token timeout
- **Retry Attempts** (0-5): Number of retry attempts on failure

## Import/Export Settings

### Export Your Configuration

1. Open Settings (⚙️)
2. Click **Export Settings** button at the bottom
3. Save the JSON file to your preferred location

### Import a Configuration

1. Open Settings (⚙️)
2. Click **Import Settings** button at the bottom
3. Select a previously exported JSON file
4. Confirm the import

### Reset to Defaults

1. Open Settings (⚙️)
2. Click **Reset to Defaults** button at the bottom
3. Confirm the reset
4. All settings will revert to factory defaults

## Legacy: Environment Variables (For Developers Only)

> ⚠️ **Deprecated**: This method is kept for backwards compatibility only. **Use Settings UI instead.**

If you need to use environment variables during development (not recommended):

```bash
# Copy template
cp .env.template .env.local

# Edit .env.local with your API keys
# See .env.template for available variables
```

**Note**: Settings UI configuration always overrides environment variables.

## Model Capabilities & Token Limits

Different models have different maximum token limits:

| Model | Provider | Max Tokens | Best For |
|-------|----------|------------|----------|
| deepseek-reasoner | DeepSeek | 65,536 | Complex reasoning tasks |
| claude-3-7-sonnet | Anthropic | 128,000 | Long-context tasks |
| gemini-2.0-flash-thinking | Google | 65,536 | Reasoning with multimodal |
| deepseek-chat | DeepSeek | 8,192 | General tasks |
| qwen-max | Qwen | 8,192 | Chinese language tasks |
| claude-3.5-sonnet | Anthropic | 8,000 | Balanced performance |

The application automatically configures the correct token limit based on your selected model.

## Security & Best Practices

✅ **Do:**
- Use the Settings UI to configure API keys
- Export your settings regularly as backup
- Use different API keys for development and production

❌ **Don't:**
- Never commit actual API keys to version control
- Don't share your exported settings files (they contain API keys)
- Don't hardcode API keys in source code

**Security Features:**
- API keys stored in encrypted electron-store
- Settings files are excluded from git (`.gitignore`)
- Import/Export uses secure JSON format

## Troubleshooting

### Settings UI Issues

**Problem**: Can't find Settings
- **Solution**: Click the ⚙️ icon in the top-right corner of the application

**Problem**: Changes not saving
- **Solution**:
  - Make sure you click **Save** or **Apply** button
  - Check electron-store permissions in `~/Library/Application Support/ai-browser/`

**Problem**: Settings not syncing across windows
- **Solution**:
  - Close all windows and restart the application
  - Check for error messages in Developer Tools (Help → Toggle Developer Tools)

### API Key Issues

**Problem**: "API key is invalid" error
- **Solution**:
  - Verify you copied the complete API key (no extra spaces)
  - Check that the API key is active in the provider's dashboard
  - Ensure you have sufficient credits/quota

**Problem**: "Cannot connect to API" error
- **Solution**:
  - Check your internet connection
  - If using proxy, verify proxy settings in Network panel
  - Verify the API provider's service status
  - Try a different provider to isolate the issue

### Common Issues

- **Model not available**: Some providers have regional restrictions
- **Rate limiting**: You may have exceeded the API provider's rate limits
- **Proxy not working**: Ensure proxy format is correct (e.g., `http://127.0.0.1:7890`)
- **Import failed**: Ensure the JSON file is from a valid Settings export

### Getting Help

If you encounter issues not covered here:

1. Check the [GitHub Issues](https://github.com/DeepFundAI/ai-browser/issues) page
2. Open Developer Tools (Help → Toggle Developer Tools) to check for errors
3. Create a new issue with details about your problem