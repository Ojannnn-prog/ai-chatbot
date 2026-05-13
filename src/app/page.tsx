'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import ChatInput from '@/components/ChatInput';
import MessageBubble from '@/components/MessageBubble';
import Sidebar from '@/components/Sidebar';
import { Conversation, Message } from '@/types';

/* ── helpers ─────────────────────────────────────────────── */
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

/* ── component ───────────────────────────────────────────── */
export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const activeConversation = conversations.find((c) => c.id === activeId) ?? null;
  const messages = activeConversation?.messages ?? [];

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
      if (activeId === id) setActiveId(null);
    },
    [activeId]
  );


  /* ── send message ──────────────────────────────────────── */
  const sendMessage = useCallback(
    async (text: string) => {
      /* ensure there's an active conversation */
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

      /* add user message + empty assistant placeholder */
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const updated: Conversation = {
            ...c,
            messages: [...c.messages, userMsg, assistantMsg],
            updatedAt: new Date(),
            /* set title from first message */
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
        /* build history to send (exclude the empty assistant placeholder) */
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

        // Non-OK responses carry a JSON body with a friendly error message
        if (!res.ok || !res.body) {
          let errMsg = `Request failed (${res.status})`;
          try {
            const data = await res.json();
            if (data?.error) errMsg = data.error;
          } catch {
            // body wasn't JSON — use default message
          }
          throw new Error(errMsg);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          accumulated += decoder.decode(value, { stream: true });

          /* update assistant message content in real-time */
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
        const errMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
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
  return (
    <div className="flex h-full bg-[#212121] text-[#ececec]">
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
            <div className="max-w-3xl mx-auto py-4">
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
