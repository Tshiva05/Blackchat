"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { User } from "@/types";

export default function IdCard({ user }: { user: User }) {
  const [copied, setCopied] = useState(false);

  function copyId() {
    navigator.clipboard?.writeText(user.chatId).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-xl2 border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-[#111823]">
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">Your chat ID</div>
      <div className="mt-1 flex items-center justify-between">
        <span className="font-mono text-xl font-bold tracking-wider text-brand">{user.chatId}</span>
        <button
          onClick={copyId}
          className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          title="Copy ID"
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </div>
      <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">{user.displayName}</div>
      <div className="text-xs text-gray-400">@{user.username}</div>
    </div>
  );
}
