'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';

/* ── Types ───────────────────────────────────────────────── */
export type Role = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: Role;
  content: string;
  timestamp: Date;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

/* ── Inline Components (Untuk Preview) ───────────────────── */

const Sidebar = ({ conversations, activeId, onSelect, onNew, onDelete }: any) => (
  <div className="w-64 bg-[#171717] flex flex-col h-full border-r border-[#2a2a2a] shrink-0">
    <div className="p-3">
      <button
        onClick={onNew}
        className="w-full flex items-center gap-2 px-3 py-2 bg-[#212121] hover:bg-[#2a2a2a] text-white rounded-lg transition-colors border border-[#333]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        New Chat
      </button>
    </div>
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      {conversations.map((c: any) => (
        <div
          key={c.id}
          className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${activeId === c.id ? 'bg-[#2a2a2a] text-white' : 'text-[#8e8ea0] hover:bg-[#212121]'
            }`}
          onClick={() => onSelect(c.id)}
        >
          <span className="truncate text-sm">{c.title}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="hidden group-hover:block text-[#8e8ea0] hover:text-red-400"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  </div>
);

const ChatInput = ({ onSend, isStreaming, disabled }: any) => {
  const [input, setInput] = useState('');
  const handleSend = () => {
    if (!input.trim() || disabled) return;
    onSend(input);
    setInput('');
  };

  return (
    <div className="p-4 bg-[#212121]">
      <div className="max-w-3xl mx-auto relative flex items-center">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Send a message..."
          className="w-full bg-[#2a2a2a] text-white border border-[#3a3a3a] rounded-xl pl-4 pr-12 py-3 focus:outline-none focus:border-[#10a37f]/50 resize-none overflow-hidden h-[52px] max-h-[200px]"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled || isStreaming}
          className="absolute right-2 bottom-1.5 p-2 bg-[#10a37f] text-white rounded-lg disabled:opacity-50 disabled:bg-[#333] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <div className="text-center text-[#8e8ea0] text-xs mt-3">
        AI can make mistakes. Check important info.
      </div>
    </div>
  );
};

const MessageBubble = ({ message, isStreaming }: any) => {
  const isUser = message.role === 'user';
  return (
    <div className={`py-6 px-4 ${isUser ? '' : 'bg-[#171717]'}`}>
      <div className="max-w-3xl mx-auto flex gap-4">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isUser ? 'bg-[#333]' : 'bg-[#10a37f]'}`}>
          {isUser ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="text-white text-[15px] whitespace-pre-wrap mt-1 leading-relaxed">
            {message.content}
            {isStreaming && <span className="inline-block w-2 h-4 bg-[#10a37f] ml-1 animate-pulse align-middle" />}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Helpers ─────────────────────────────────────────────── */
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeConversation(): Conversation {
  return {
    id: uid(),
    title: 'New conversation',
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

const WELCOME_PROMPTS = [
  'Explain quantum computing in simple terms',
  'Write a Python script to sort a list',
  'What are the benefits of meditation?',
  'How does the internet actually work?',
];

/* ── Main App Component ──────────────────────────────────── */
export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

  /* ── fitur memori (localStorage) ───────────────────────── */
  useEffect(() => {
    const savedData = localStorage.getItem('ai-chatbot-memory');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        if (parsedData && parsedData.length > 0) {
          setConversations(parsedData);
          setActiveId(parsedData[0].id);
        }
      } catch (error) {
        console.error('Gagal memuat memori:', error);
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('ai-chatbot-memory', JSON.stringify(conversations));
    }
  }, [conversations, isLoaded]);

  /* scroll to bottom on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, messages[messages.length - 1]?.content]);

  /* ── conversation helpers ──────────────────────────────── */
  const createNewConversation = useCallback(() => {
    const conv = makeConversation();
    setConversations((prev) => [conv, ...prev]);
    setActiveId(conv.id);
  }, []);

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeId === id) {
        setConversations((prev) => {
          if (prev.length > 0) setActiveId(prev[0].id);
          else setActiveId(null);
          return prev;
        });
      }
    },
    [activeId]
  );

  /* ── send message ──────────────────────────────────────── */
  const sendMessage = useCallback(
    async (text: string) => {
      let convId = activeId;
      if (!convId) {
        const conv = makeConversation();
        setConversations((prev) => [conv, ...prev]);
        setActiveId(conv.id);
        convId = conv.id;
      }

      const userMsg: Message = {
        id: uid(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };

      const assistantMsg: Message = {
        id: uid(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const updated: Conversation = {
            ...c,
            messages: [...c.messages, userMsg, assistantMsg],
            updatedAt: new Date(),
            title:
              c.messages.length === 0
                ? text.slice(0, 48) + (text.length > 48 ? '…' : '')
                : c.title,
          };
          return updated;
        })
      );

      setIsStreaming(true);
      abortRef.current = new AbortController();

      try {
        const historyMessages = [
          ...(conversations.find((c) => c.id === convId)?.messages ?? []),
          userMsg,
        ].map((m) => ({ role: m.role, content: m.content }));

        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyMessages }),
          signal: abortRef.current.signal,
        });

        if (!res.ok || !res.body) {
          let errMsg = `Request failed (${res.status})`;
          try {
            const data = await res.json();
            if (data?.error) errMsg = data.error;
          } catch { }
          throw new Error(errMsg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          const snapshot = accumulated;
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id !== convId) return c;
              return {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === assistantMsg.id ? { ...m, content: snapshot } : m
                ),
              };
            })
          );
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') return;
        const errMsg = err instanceof Error ? err.message : 'An error occurred (Since this is a preview, the /api/chat route is not available here).';
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              messages: c.messages.map((m) =>
                m.id === assistantMsg.id
                  ? { ...m, content: `⚠️ ${errMsg}` }
                  : m
              ),
            };
          })
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [activeId, conversations]
  );

  /* ── render ───────────────────────────────────────────── */
  if (!isLoaded) return <div className="flex h-screen bg-[#212121]" />;

  return (
    <div className="flex h-screen w-full bg-[#212121] text-[#ececec] font-sans">
      {/* Sidebar */}
      {sidebarOpen && (
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onSelect={setActiveId}
          onNew={createNewConversation}
          onDelete={deleteConversation}
        />
      )}

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#2a2a2a] shrink-0">
          <button
            id="toggle-sidebar-btn"
            onClick={() => setSidebarOpen((o) => !o)}
            className="p-2 rounded-lg text-[#8e8ea0] hover:text-white hover:bg-[#2a2a2a] transition-colors"
            title="Toggle sidebar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">
              {activeConversation?.title ?? 'GeminiChat'}
            </span>
            {isStreaming && (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#10a37f] font-medium bg-[#10a37f]/10 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10a37f] animate-pulse" />
                Generating
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden sm:inline text-[11px] text-[#555] bg-[#2a2a2a] px-2 py-1 rounded-full">
              gemini-2.0-flash
            </span>
          </div>
        </header>

        {/* Messages area */}
        <main className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            /* Welcome screen */
            <div className="flex flex-col items-center justify-center h-full px-4 pb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#10a37f] to-[#0ea5e9] flex items-center justify-center mb-6 shadow-xl shadow-[#10a37f]/20">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">GeminiChat</h1>
              <p className="text-[#8e8ea0] text-sm mb-8 text-center max-w-sm">
                Powered by Google Gemini 2.0 Flash. Ask me anything — I&apos;m here to help.
              </p>

              {/* Prompt suggestions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xl">
                {WELCOME_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="text-left text-sm text-[#c5c5d2] bg-[#2a2a2a] hover:bg-[#333] border border-[#3a3a3a] hover:border-[#10a37f]/50 rounded-xl px-4 py-3 transition-all duration-150 group"
                  >
                    <span className="group-hover:text-white transition-colors">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Message list */
            <div className="w-full pb-4">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isStreaming={
                    isStreaming &&
                    idx === messages.length - 1 &&
                    msg.role === 'assistant'
                  }
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          disabled={false}
        />
      </div>
    </div>
  );
}