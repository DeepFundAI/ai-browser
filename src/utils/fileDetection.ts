import path from 'path';
import { FileAttachment } from '@/models';

/**
 * Detect file type based on extension
 */
export const detectFileType = (fileName: string): FileAttachment['type'] => {
  const ext = path.extname(fileName).toLowerCase();

  // Markdown files
  if (['.md', '.markdown'].includes(ext)) {
    return 'markdown';
  }

  // Code files (programming languages, html, css, etc.)
  const codeExtensions = [
    '.js', '.ts', '.tsx', '.jsx',       // JavaScript/TypeScript
    '.py', '.pyw',                       // Python
    '.java', '.kt', '.scala',            // JVM languages
    '.cpp', '.cc', '.cxx', '.c', '.h',  // C/C++
    '.go',                               // Go
    '.rs',                               // Rust
    '.rb',                               // Ruby
    '.php',                              // PHP
    '.swift',                            // Swift
    '.dart',                             // Dart
    '.html', '.htm',                     // HTML
    '.css', '.scss', '.sass', '.less',   // CSS
    '.vue', '.svelte',                   // Frontend frameworks
    '.sh', '.bash', '.zsh',              // Shell scripts
    '.sql',                              // SQL
  ];
  if (codeExtensions.includes(ext)) {
    return 'code';
  }

  // Text files (config, data, logs, etc.)
  const textExtensions = [
    '.txt', '.text',
    '.json', '.jsonc',
    '.xml',
    '.yaml', '.yml',
    '.csv', '.tsv',
    '.log',
    '.ini', '.cfg', '.conf',
    '.env',
    '.gitignore', '.dockerignore',
  ];
  if (textExtensions.includes(ext)) {
    return 'text';
  }

  // Other types
  return 'other';
};

/**
 * Get tool operation description
 */
export const getToolOperation = (toolName: string): string => {
  const operations: Record<string, string> = {
    'navigate_to': 'Navigate to page',
    'click': 'Click element',
    'input_text': 'Input text',
    'screenshot': 'Take screenshot',
    'extract_content': 'Extract content',
    'scroll': 'Scroll page',
    'wait': 'Wait',
    'file_write': 'Write file'
  };

  return operations[toolName] || toolName;
};

/**
 * Get tool status
 */
export const getToolStatus = (messageType: string): 'running' | 'completed' | 'error' => {
  if (messageType === 'tool_result') return 'completed';
  if (messageType === 'tool_running' || messageType === 'tool_call') return 'running';
  return 'error';
};
