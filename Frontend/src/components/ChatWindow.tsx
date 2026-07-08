"use client";

import { useEffect, useRef } from "react";
import { Send, Trash2 } from "lucide-react";
import { Chat, Message, User } from "@/types";
import MessageBubble from "./MessageBubble";
import VoiceCommandBar from "./VoiceCommandBar";

export default function ChatWindow({
  chat,
  messages,
  me,
  draft,
  onDraftChange,
  onSend,
  onTyping,
  typingLabel,
  onEraseChat,
  voice,
}: {
  chat: Chat;
  messages: Message[];
  me: User;
  draft: string;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onTyping: () => void;
  typingLabel: string | null;
  onEraseChat: () => void;
  voice: { listening: boolean; supported: boolean; lastHeard: string; toggle: () => void };
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const other = chat.type === "direct" ? chat.participants.find((p) => p.id !== me.id) : undefined;
  const title = chat.type === "group" ? chat.groupName : other?.displayName || "Unknown user";
  const subtitle =
    chat.type === "group"
      ? `${chat.participants.length} members`
      : other?.isOnline
      ? "Online"
      : other?.lastSeen
      ? `Last seen ${new Date(other.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
      : "";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3 dark:border-gray-800">
        <div>
          <div className="font-semibold text-gray-900 dark:text-white">{title}</div>
          <div className="text-xs text-gray-400">{typingLabel || subtitle}</div>
        </div>
        <div className="flex items-center gap-3">
          <VoiceCommandBar {...voice} onToggle={voice.toggle} />
          <button
            onClick={onEraseChat}
            title="Erase chat"
            className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 dark:hover:bg-gray-800"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-gray-50 px-5 py-4 dark:bg-[#0B0F14]">
        {messages.length === 0 && (
          <div className="mt-10 text-center text-sm text-gray-400">
            No messages yet. Say "send hello" or just type below.
          </div>
        )}
        {messages.map((m) => (
          <MessageBubble key={m._id || m.tempId} message={m} isMine={m.sender.id === me.id} />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        <input
          value={draft}
          onChange={(e) => {
            onDraftChange(e.target.value);
            onTyping();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          placeholder="Type a message…"
          className="flex-1 rounded-full border border-gray-300 bg-transparent px-4 py-2 text-sm outline-none focus:border-brand dark:border-gray-700"
        />
        <button
          onClick={onSend}
          disabled={!draft.trim()}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}
