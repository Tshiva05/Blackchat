"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Settings, MessageSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSocket } from "@/context/SocketContext";
import { api } from "@/lib/api";
import { Chat, CustomVoiceCommand, Message } from "@/types";
import IdCard from "@/components/IdCard";
import SearchBar from "@/components/SearchBar";
import ChatList from "@/components/ChatList";
import ChatWindow from "@/components/ChatWindow";
import { useVoiceCommands } from "@/components/useVoiceCommands";

export default function ChatPage() {
  const { user, loading, logout } = useAuth();
  const socket = useSocket();
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [typingLabel, setTypingLabel] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [customCommands, setCustomCommands] = useState<CustomVoiceCommand[]>([]);

  const activeChatRef = useRef<Chat | null>(null);
  activeChatRef.current = activeChat;
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }, []);

  // ---- Load chat list ----
  const loadChats = useCallback(async () => {
    const res = await api.get("/chats");
    setChats(res.data.chats);
  }, []);

  useEffect(() => {
    if (user) loadChats();
  }, [user, loadChats]);

  // Load this user's customized voice command phrases (e.g. "destroy" -> erase_chat)
  useEffect(() => {
    if (!user) return;
    api
      .get("/users/voice-commands")
      .then((res) => setCustomCommands(res.data.customVoiceCommands || []))
      .catch(() => setCustomCommands([]));
  }, [user]);

  // ---- Open a chat (by Chat object) ----
  const openChat = useCallback(
    async (chat: Chat) => {
      setActiveChat(chat);
      socket?.emit("chat:join", chat._id);
      const res = await api.get(`/chats/${chat._id}/messages`);
      setMessages(res.data.messages);
    },
    [socket]
  );

  // ---- Start/open a direct chat from a search result ----
  const openChatWithUserId = useCallback(
    async (targetUserId: string) => {
      const res = await api.post("/chats/direct", { targetUserId });
      await loadChats();
      openChat(res.data.chat);
    },
    [loadChats, openChat]
  );

  // ---- Open a chat by typed/spoken chat ID ----
  const openChatByChatId = useCallback(
    async (chatIdOrQuery: string) => {
      const digits = chatIdOrQuery.match(/\d{4,}/)?.[0];
      const q = digits || chatIdOrQuery.trim();
      if (!q) return;
      const res = await api.get("/users/search", { params: { q } });
      const target = res.data.results[0];
      if (!target) {
        showToast(`No user found for "${q}".`);
        return;
      }
      openChatWithUserId(target.id);
    },
    [openChatWithUserId, showToast]
  );

  // ---- Sending messages ----
  const sendMessage = useCallback(
    (text: string) => {
      const chat = activeChatRef.current;
      const body = text.trim();
      if (!chat || !body || !socket || !user) return;

      const tempId = `temp-${Date.now()}`;
      const optimistic: Message = {
        _id: tempId,
        tempId,
        chat: chat._id,
        sender: user,
        type: "text",
        content: body,
        reactions: [],
        starredBy: [],
        deletedForEveryone: false,
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((prev) => [...prev, optimistic]);

      socket.emit(
        "message:send",
        { chatId: chat._id, tempId, type: "text", content: body },
        (ack: any) => {
          if (ack?.error) {
            showToast(`Message failed: ${ack.error}`);
            return;
          }
          setMessages((prev) => prev.map((m) => (m.tempId === tempId ? { ...ack.message, tempId } : m)));
        }
      );
    },
    [socket, user, showToast]
  );

  function handleSendClick() {
    sendMessage(draft);
    setDraft("");
  }

  function handleTyping() {
    const chat = activeChatRef.current;
    if (!chat || !socket) return;
    socket.emit("typing:start", { chatId: chat._id });
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit("typing:stop", { chatId: chat._id }), 1500);
  }

  // ---- Erase chat (also the flagship voice command) ----
  const eraseChat = useCallback(async () => {
    const chat = activeChatRef.current;
    if (!chat) {
      showToast('Open a chat before saying "erase the chat."');
      return;
    }
    await api.post(`/chats/${chat._id}/clear`);
    socket?.emit("chat:cleared", { chatId: chat._id });
    setMessages([]);
    showToast("Chat erased.");
  }, [socket, showToast]);

  // ---- Socket event wiring ----
  useEffect(() => {
    if (!socket) return;

    function onNewMessage({ message, tempId }: { message: Message; tempId?: string }) {
      const chat = activeChatRef.current;
      if (chat && message.chat === chat._id) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => m.tempId !== tempId);
          if (withoutTemp.some((m) => m._id === message._id)) return withoutTemp;
          return [...withoutTemp, message];
        });
      }
      loadChats();
    }

    function onTypingUpdate({ chatId, isTyping }: { chatId: string; isTyping: boolean }) {
      if (activeChatRef.current?._id === chatId) {
        setTypingLabel(isTyping ? "typing…" : null);
      }
    }

    function onChatCleared({ chatId }: { chatId: string }) {
      if (activeChatRef.current?._id === chatId) setMessages([]);
    }

    socket.on("message:new", onNewMessage);
    socket.on("typing:update", onTypingUpdate);
    socket.on("chat:cleared", onChatCleared);
    return () => {
      socket.off("message:new", onNewMessage);
      socket.off("typing:update", onTypingUpdate);
      socket.off("chat:cleared", onChatCleared);
    };
  }, [socket, loadChats]);

  // ---- Dark mode ----
  const toggleDarkMode = useCallback(() => {
    const html = document.documentElement;
    const isDark = html.classList.toggle("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    showToast(isDark ? "Dark mode on." : "Dark mode off.");
  }, [showToast]);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") document.documentElement.classList.add("dark");
  }, []);

  // ---- Voice commands ----
  const voice = useVoiceCommands(customCommands, {
    erase_chat: () => eraseChat(),
    search_user: (arg) => {
      showToast(`Searching for "${arg}"…`);
      openChatByChatId(arg);
    },
    send_message: (arg) => {
      if (!activeChatRef.current) {
        showToast("Open a chat first.");
        return;
      }
      sendMessage(arg);
      showToast("Message sent by voice.");
    },
    dark_mode: () => toggleDarkMode(),
    logout: async () => {
      await logout();
      router.push("/login");
    },
    open_settings: () => router.push("/settings"),
    mute_notifications: () => {
      const chat = activeChatRef.current;
      if (!chat) return;
      api.post(`/chats/${chat._id}/mute`);
      showToast("Chat muted.");
    },
    call_user: () => showToast("Voice/video calling isn't included in this build yet."),
    record_voice_note: () => showToast("Voice note recording isn't included in this build yet."),
    delete_message: () => showToast("Say a message's reactions menu to delete — voice targeting isn't wired up yet."),
    create_group: () => showToast("Use the \"New group\" option in the sidebar to create a group."),
  });

  if (loading || !user) {
    return <div className="flex h-screen items-center justify-center text-gray-400">Loading…</div>;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#0B0F14]">
      {/* Sidebar */}
      <div className="flex w-80 flex-shrink-0 flex-col gap-4 border-r border-gray-200 p-4 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="text-brand" size={20} />
            <span className="font-bold text-gray-900 dark:text-white">Chat App</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => router.push("/settings")}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Settings size={16} />
            </button>
            <button
              onClick={async () => {
                await logout();
                router.push("/login");
              }}
              className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        <IdCard user={user} />
        <SearchBar onOpenChat={openChatWithUserId} />

        <div className="flex-1 overflow-y-auto">
          <ChatList chats={chats} myId={user.id} activeChatId={activeChat?._id || null} onSelect={openChat} />
        </div>

        <div className="rounded-lg bg-gray-100 p-3 text-[11px] leading-relaxed text-gray-500 dark:bg-gray-900 dark:text-gray-400">
          Try saying: "erase the chat" &middot; "search &lt;id&gt;" &middot; "send hello" &middot; "dark mode"
        </div>
      </div>

      {/* Main pane */}
      <div className="flex-1">
        {activeChat ? (
          <ChatWindow
            chat={activeChat}
            messages={messages}
            me={user}
            draft={draft}
            onDraftChange={setDraft}
            onSend={handleSendClick}
            onTyping={handleTyping}
            typingLabel={typingLabel}
            onEraseChat={eraseChat}
            voice={voice}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-gray-400">
            <MessageSquare size={36} className="mb-3 text-gray-300" />
            <p>Search a chat ID to start a conversation.</p>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
            }
    
