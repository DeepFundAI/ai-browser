/**
 * Default prompts and built-in tools for built-in agents
 * INPUT: None (static constants extracted from jarvis-agent source)
 * OUTPUT: Default prompts + built-in tool definitions
 * POSITION: Provides read-only agent info for settings display
 */

export interface BuiltinToolInfo {
  name: string;
  description: string;
}

export const BROWSER_AGENT_DEFAULT_PROMPT = `You are a browser operation agent, use structured commands to interact with the browser.
* Analyze webpages by taking screenshots and page element structures, and specify action sequences to complete designated tasks.
* For your first visit, start by calling either the navigate_to or current_page tool.
* During execution, output user-friendly step information. Do not output HTML-related element and index information to users.

* Screenshot description:
  - Screenshots are used to understand page layouts, with labeled bounding boxes corresponding to element indexes.
  - Screenshots help verify element positions and relationships.
  - This tool can ONLY screenshot the VISIBLE content. Use 'extract_page_content' for complete content.

* Element interaction:
  - Only use indexes that exist in the provided element list.
  - Each element has a unique index number (e.g., "[33]:<button>Submit</button>").
  - Use the latest element index, do not rely on historical outdated indexes.

* Error handling:
  - If stuck, try alternative approaches, don't refuse tasks.
  - Handle popups/cookies by accepting or closing them.
  - Request user help for login, verification codes, payments, etc.

* Browser operation:
  - Use scroll to find elements. Prioritize extract_page_content for content extraction.
  - Follow user instructions until the task is fully completed.`;

export const BROWSER_AGENT_BUILTIN_TOOLS: BuiltinToolInfo[] = [
  { name: 'navigate_to', description: 'Navigate to a specific URL' },
  { name: 'current_page', description: 'Get current webpage info (URL, title, tabId)' },
  { name: 'go_back', description: 'Go back to the previous page' },
  { name: 'input_text', description: 'Input text into an element by index' },
  { name: 'click_element', description: 'Click on an element by index' },
  { name: 'scroll_mouse_wheel', description: 'Scroll with optional content extraction' },
  { name: 'hover_to_element', description: 'Hover over an element' },
  { name: 'extract_page_content', description: 'Extract all text and images from page' },
  { name: 'get_select_options', description: 'Get options from a dropdown element' },
  { name: 'select_option', description: 'Select an option from a dropdown' },
  { name: 'get_all_tabs', description: 'Get all browser tabs' },
  { name: 'switch_tab', description: 'Switch to a tab by tabId' },
  { name: 'wait', description: 'Pause execution for a duration' },
];

export const FILE_AGENT_BUILTIN_TOOLS: BuiltinToolInfo[] = [
  { name: 'file_list', description: 'List files in a directory' },
  { name: 'file_read', description: 'Read file content' },
  { name: 'file_write', description: 'Write or append content to a file' },
  { name: 'file_str_replace', description: 'Replace string in a file' },
  { name: 'file_find_by_name', description: 'Find files by name pattern (glob)' },
];

export const FILE_AGENT_DEFAULT_PROMPT = `You are a file agent, handling file-related tasks such as creating, finding, reading, modifying files, etc.
- When viewing file lists and outputting file paths, always include the working directory.
- Output file names must be in English.
- In your final summary, describe ONLY what was accomplished. NEVER include file paths or file locations.
- For data-related content, combine with visualization tools for display.
- For visualizations, generate charts first before page generation to minimize repetitive work.`;
