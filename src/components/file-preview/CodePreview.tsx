import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';

// Custom theme based on project's color scheme
const customTheme = {
  ...oneDark,
  'pre[class*="language-"]': {
    ...oneDark['pre[class*="language-"]'],
    background: 'transparent',
  },
  'code[class*="language-"]': {
    ...oneDark['code[class*="language-"]'],
    background: 'transparent',
  },
};

interface CodePreviewProps {
  content: string;
  fileName?: string;
}

// File extension to language mapping
const EXTENSION_LANGUAGE_MAP: Record<string, string> = {
  // Web
  js: 'javascript',
  jsx: 'jsx',
  ts: 'typescript',
  tsx: 'tsx',
  html: 'html',
  css: 'css',
  scss: 'scss',
  less: 'less',
  json: 'json',
  // Backend
  py: 'python',
  java: 'java',
  go: 'go',
  rs: 'rust',
  rb: 'ruby',
  php: 'php',
  c: 'c',
  cpp: 'cpp',
  cs: 'csharp',
  swift: 'swift',
  kt: 'kotlin',
  // Config & Data
  yml: 'yaml',
  yaml: 'yaml',
  xml: 'xml',
  toml: 'toml',
  ini: 'ini',
  // Shell & Scripts
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  ps1: 'powershell',
  // Database
  sql: 'sql',
  // Markdown
  md: 'markdown',
  mdx: 'markdown',
};

/**
 * Detect language from file extension
 */
function detectLanguage(fileName?: string): string | null {
  if (!fileName) return null;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext ? EXTENSION_LANGUAGE_MAP[ext] || null : null;
}

/**
 * Check if content is markdown
 */
function isMarkdownFile(fileName?: string): boolean {
  if (!fileName) return false;
  const ext = fileName.split('.').pop()?.toLowerCase();
  return ext === 'md' || ext === 'mdx';
}

/**
 * Check if content looks like HTML
 */
function looksLikeHtml(content: string): boolean {
  const trimmed = content.trim();
  return trimmed.startsWith('<!DOCTYPE') ||
         trimmed.startsWith('<html') ||
         (trimmed.startsWith('<') && trimmed.includes('</'));
}

/**
 * CodePreview Component
 * Renders code with syntax highlighting or markdown with rich formatting
 */
export const CodePreview: React.FC<CodePreviewProps> = ({ content, fileName }) => {
  const { isMarkdown, language } = useMemo(() => {
    const md = isMarkdownFile(fileName);
    let lang = detectLanguage(fileName);

    // Auto-detect HTML if no extension
    if (!lang && looksLikeHtml(content)) {
      lang = 'html';
    }

    return { isMarkdown: md, language: lang };
  }, [content, fileName]);

  // Render markdown files
  if (isMarkdown) {
    return (
      <div className="markdown-container p-4">
        <ReactMarkdown
          components={{
            // Custom code block rendering with syntax highlighting
            code({ className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '');
              const codeContent = String(children).replace(/\n$/, '');

              // Inline code
              if (!match) {
                return (
                  <code className={className} {...props}>
                    {children}
                  </code>
                );
              }

              // Code block with language
              return (
                <SyntaxHighlighter
                  style={customTheme}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    background: '#1D273F',
                  }}
                >
                  {codeContent}
                </SyntaxHighlighter>
              );
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Render code files with syntax highlighting
  return (
    <div className="code-preview h-full">
      <SyntaxHighlighter
        style={customTheme}
        language={language || 'text'}
        showLineNumbers
        lineNumberStyle={{
          minWidth: '3em',
          paddingRight: '1em',
          color: 'rgba(255, 255, 255, 0.3)',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          marginRight: '1em',
        }}
        customStyle={{
          margin: 0,
          padding: '16px',
          borderRadius: '6px',
          fontSize: '13px',
          lineHeight: '1.6',
          background: 'transparent',
          minHeight: '100%',
        }}
        wrapLongLines
      >
        {content}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodePreview;
