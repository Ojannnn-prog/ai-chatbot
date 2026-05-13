'use client';

import { useRef, useState } from 'react';

interface ChatInputProps {
  onSend: (message: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function ChatInput({ onSend, isStreaming, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = value.trim().length > 0 && !isStreaming && !disabled;

  const handleSubmit = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <div
          className={`relative flex items-end gap-2 rounded-2xl border transition-colors duration-200 bg-[#2f2f2f] ${
            disabled
              ? 'border-[#333] opacity-60'
              : 'border-[#444] focus-within:border-[#10a37f]'
          }`}
        >
          <textarea
            ref={textareaRef}
            id="chat-input"
            rows={1}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled || isStreaming}
            placeholder={isStreaming ? 'GeminiChat is thinking…' : 'Message GeminiChat…'}
            className="flex-1 resize-none bg-transparent text-[#ececec] placeholder:text-[#666] text-sm px-4 py-3.5 focus:outline-none max-h-48 overflow-y-auto leading-relaxed"
            style={{ minHeight: '52px' }}
          />

          {/* Send / Stop button */}
          <div className="shrink-0 p-2">
            {isStreaming ? (
              <button
                id="stop-btn"
                className="w-9 h-9 rounded-xl bg-[#404040] hover:bg-[#555] flex items-center justify-center transition-colors"
                title="Stop generating"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#ececec">
                  <rect x="5" y="5" width="14" height="14" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                id="send-btn"
                onClick={handleSubmit}
                disabled={!canSend}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  canSend
                    ? 'bg-[#10a37f] hover:bg-[#0d8a6b] shadow-lg shadow-[#10a37f]/20'
                    : 'bg-[#3a3a3a] cursor-not-allowed'
                }`}
                title="Send message"
              >
                <svg
                  width="16" height="16" viewBox="0 0 24 24"
                  fill="none" stroke={canSend ? 'white' : '#666'} strokeWidth="2.5"
                  strokeLinecap="round" strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-[10px] text-[#555] mt-2">
          GeminiChat can make mistakes. Press <kbd className="px-1 rounded bg-[#333] text-[#888] font-mono">Enter</kbd> to send, <kbd className="px-1 rounded bg-[#333] text-[#888] font-mono">Shift+Enter</kbd> for new line.
        </p>
      </div>
    </div>
  );
}
