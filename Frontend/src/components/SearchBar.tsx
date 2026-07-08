"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { api } from "@/lib/api";

interface SearchResult {
  id: string;
  chatId: string;
  name: string;
  username: string;
  displayName: string;
  profilePicture?: string;
}

export default function SearchBar({ onOpenChat }: { onOpenChat: (userId: string) => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [searched, setSearched] = useState(false);

  async function runSearch(q: string) {
    const trimmed = q.trim();
    setQuery(q);
    if (!trimmed) {
      setResults([]);
      setSearched(false);
      return;
    }
    setBusy(true);
    try {
      const res = await api.get("/users/search", { params: { q: trimmed } });
      setResults(res.data.results);
      setSearched(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="relative">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => runSearch(e.target.value)}
          placeholder="Search by chat ID or username…"
          className="w-full rounded-lg border border-gray-300 bg-transparent py-2 pl-9 pr-3 text-sm outline-none focus:border-brand dark:border-gray-700"
        />
      </div>

      {searched && (
        <div className="mt-2 max-h-56 space-y-1 overflow-y-auto">
          {results.length === 0 && !busy && (
            <div className="px-1 py-2 text-xs text-gray-400">No users found for "{query}".</div>
          )}
          {results.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 p-2 text-sm dark:border-gray-800"
            >
              <div>
                <div className="font-medium text-gray-800 dark:text-gray-100">{r.displayName}</div>
                <div className="text-xs text-gray-400">
                  @{r.username} &middot; ID {r.chatId}
                </div>
              </div>
              <button
                onClick={() => onOpenChat(r.id)}
                className="flex items-center gap-1 rounded-md bg-brand px-2 py-1 text-xs font-medium text-white hover:bg-brand-dark"
              >
                <UserPlus size={12} /> Chat
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
