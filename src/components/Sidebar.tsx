'use client';

import { Conversation } from '@/types';
import { useState } from 'react';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: SidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <aside className="flex flex-col h-full bg-[#171717] w-64 shrink-0 border-r border-[#2a2a2a]">
      {/* Header */}
      <div className="p-3 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2 px-2 py-1 mb-3">
          <div className="w-7 h-7 rounded-lg bg-[#10a37f] flex items-center justify-center shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
            </svg>
          </div>
          <span className="font-semibold text-white text-sm tracking-tight">Mari Tanya</span>
        </div>

        {/* New Chat Button */}
        <button
          id="new-chat-btn"
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#ececec] hover:bg-[#2a2a2a] transition-colors duration-150 group"
        >
          <span className="w-5 h-5 rounded-md border border-[#404040] flex items-center justify-center group-hover:border-[#10a37f] transition-colors">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </span>
          Percakapan Baru
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {conversations.length === 0 && (
          <p className="text-xs text-[#8e8ea0] text-center mt-8 px-4">
            No conversations yet. Start a new chat!
          </p>
        )}
        {conversations
          .slice()
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .map((conv) => (
            <div
              key={conv.id}
              className="relative group"
              onMouseEnter={() => setHoveredId(conv.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              <button
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-100 truncate pr-8 ${activeId === conv.id
                  ? 'bg-[#2a2a2a] text-white'
                  : 'text-[#c5c5d2] hover:bg-[#222222] hover:text-white'
                  }`}
              >
                <span className="block truncate">{conv.title}</span>
              </button>
              {/* Delete button */}
              {(hoveredId === conv.id || activeId === conv.id) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-[#8e8ea0] hover:text-red-400 hover:bg-[#3a2a2a] transition-colors"
                  title="Delete conversation"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                </button>
              )}
            </div>
          ))}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#2a2a2a]">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#10a37f] to-[#0d6efd] flex items-center justify-center shrink-0 text-xs font-bold text-white">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-[#ececec] font-medium truncate">User</p>
            <p className="text-[10px] text-[#8e8ea0] truncate">gemini-2.0-flash</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
