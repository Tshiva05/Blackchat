"use client";

import { Chat, User } from "@/types";
import { Pin } from "lucide-react";

function otherParticipant(chat: Chat, myId: string): User | undefined {
  return chat.participants.find((p) => p.id !== myId);
}

export default function ChatList({
  chats,
  myId,
  activeChatId,
  onSelect,
}: {
  chats: Chat[];
  myId: string;
  activeChatId: string | null;
  onSelect: (chat: Chat) => void;
}) {
  const sorted = [...chats].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
  });

  return (
    <div className="space-y-1">
      {sorted.length === 0 && (
        <div className="px-1 py-6 text-center text-xs text-gray-400">
          No chats yet — search a chat ID above to start one.
        </div>
      )}
      {sorted.map((chat) => {
        const other = chat.type === "direct" ? otherParticipant(chat, myId) : undefined;
        const title = chat.type === "group" ? chat.groupName : other?.displayName || "Unknown user";
        const subtitle =
          chat.lastMessage?.deletedForEveryone
            ? "This message was deleted"
            : chat.lastMessage?.content || "No messages yet";

        return (
          <button
            key={chat._id}
            onClick={() => onSelect(chat)}
            className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition ${
              activeChatId === chat._id
                ? "bg-brand/10 dark:bg-brand/20"
                : "hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-brand/20 text-sm font-semibold text-brand">
              {title?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-medium text-gray-800 dark:text-gray-100">{title}</span>
                {chat.isPinned && <Pin size={11} className="text-gray-400" />}
              </div>
              <div className="truncate text-xs text-gray-400">{subtitle}</div>
            </div>
            {!!chat.unreadCount && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                {chat.unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
  
