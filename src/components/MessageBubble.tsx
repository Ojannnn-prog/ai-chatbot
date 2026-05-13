'use client';

import { Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
}

/** Very simple markdown-to-HTML renderer (no external deps) */
function renderMarkdown(text: string): string {
  let html = text
    // Escape HTML entities first
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Fenced code blocks ```lang\ncode```
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_m, _lang, code) => {
    return `<pre><code>${code.trim()}</code></pre>`;
  });

  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // Horizontal rule
  html = html.replace(/^---$/gm, '<hr/>');

  // Bold + italic
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  // Bold
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // Blockquote
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Unordered list
  html = html.replace(/^[-*] (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);

  // Ordered list
  html = html.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');

  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  // Paragraphs — split on double newlines
  const blocks = html.split(/\n{2,}/);
  html = blocks
    .map((block) => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (/^<(h[1-6]|pre|ul|ol|hr|blockquote)/.test(trimmed)) return trimmed;
      return `<p>${trimmed.replace(/\n/g, '<br/>')}</p>`;
    })
    .filter(Boolean)
    .join('\n');

  return html;
}

/** Detect if a message is an error that should not be markdown-rendered */
function isErrorMessage(content: string): boolean {
  return content.startsWith('⚠️') || content.startsWith('Error:') || content.startsWith('__ERROR__:');
}

/** Clean up error prefix tokens before displaying */
function cleanError(content: string): string {
  return content.replace(/^(__ERROR__:|Error:)\s*/i, '').trim();
}

export default function MessageBubble({ message, isStreaming }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  /* ── User bubble ── */
  if (isUser) {
    return (
      <div className="message-appear flex justify-end px-4 py-2">
        <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-[#2f2f2f] border border-[#3a3a3a] px-4 py-3 text-[#ececec] text-sm leading-relaxed">
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    );
  }

  /* ── Assistant — loading shimmer (empty content while streaming) ── */
  if (!message.content && isStreaming) {
    return (
      <div className="message-appear flex gap-3 px-4 py-4">
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#10a37f] to-[#0ea5e9] flex items-center justify-center mt-0.5 shadow-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 2a8 8 0 100 16A8 8 0 0012 4zm-.5 4h1v5h-1V8zm0 6.5h1v1h-1v-1z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0 pt-1 space-y-2">
          <div className="shimmer h-3 w-48 rounded" />
          <div className="shimmer h-3 w-72 rounded" />
          <div className="shimmer h-3 w-40 rounded" />
        </div>
      </div>
    );
  }

  /* ── Assistant — error card ── */
  if (isErrorMessage(message.content)) {
    const errorText = cleanError(message.content);
    return (
      <div className="message-appear flex gap-3 px-4 py-4">
        {/* Avatar — red tint on error */}
        <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-orange-500 flex items-center justify-center mt-0.5 shadow-md">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
        </div>

        {/* Error card */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-red-400 mb-2">Error</p>
          <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3">
            <p className="text-sm text-red-300 leading-relaxed whitespace-pre-wrap break-words">
              {errorText}
            </p>
          </div>
          <p className="text-[11px] text-[#555] mt-1.5">
            Check your API key and quota at{' '}
            <a
              href="https://aistudio.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#8e8ea0] transition-colors"
            >
              aistudio.google.com
            </a>
          </p>
        </div>
      </div>
    );
  }

  /* ── Assistant — normal markdown response ── */
  const htmlContent = renderMarkdown(message.content);

  return (
    <div className="message-appear flex gap-3 px-4 py-4 group">
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#10a37f] to-[#0ea5e9] flex items-center justify-center mt-0.5 shadow-md">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
          <path d="M12 2a10 10 0 110 20A10 10 0 0112 2zm0 2a8 8 0 100 16A8 8 0 0012 4zm-.5 4h1v5h-1V8zm0 6.5h1v1h-1v-1z" />
        </svg>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-[#10a37f] mb-1">GeminiChat</p>
        <div
          className={`prose-chat text-sm text-[#d1d5db] ${isStreaming ? 'cursor-blink' : ''}`}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    </div>
  );
}
