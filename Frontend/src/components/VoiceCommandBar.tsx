"use client";

import { Mic, MicOff } from "lucide-react";

export default function VoiceCommandBar({
  listening,
  supported,
  lastHeard,
  onToggle,
}: {
  listening: boolean;
  supported: boolean;
  lastHeard: string;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {lastHeard && (
        <span className="hidden max-w-[220px] truncate text-xs text-gray-400 sm:inline">
          heard: "{lastHeard}"
        </span>
      )}
      <button
        onClick={onToggle}
        disabled={!supported}
        title={supported ? "Toggle voice commands" : "Voice commands need Chrome or Edge"}
        className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
          listening ? "bg-brand text-white" : "bg-gray-100 text-gray-500 dark:bg-gray-800"
        } ${!supported ? "cursor-not-allowed opacity-40" : ""}`}
      >
        {listening ? <Mic size={16} /> : <MicOff size={16} />}
      </button>
    </div>
  );
}
