"use client";

import { Message } from "@/types";
import { Check, CheckCheck, Clock } from "lucide-react";

export default function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[70%] rounded-2xl px-3.5 py-2 text-sm ${
          isMine
            ? "rounded-br-sm bg-brand text-white"
            : "rounded-bl-sm bg-white text-gray-800 shadow-sm dark:bg-[#1A2332] dark:text-gray-100"
        }`}
      >
        {message.deletedForEveryone ? (
          <span className="italic opacity-70">This message was deleted</span>
        ) : (
          <>
            {message.type === "text" && <span className="whitespace-pre-wrap">{message.content}</span>}
            {message.type === "image" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={message.mediaUrl} alt="attachment" className="max-w-full rounded-lg" />
            )}
            {message.type === "video" && <video src={message.mediaUrl} controls className="max-w-full rounded-lg" />}
            {(message.type === "audio" || message.type === "voice_note") && (
              <audio src={message.mediaUrl} controls />
            )}
            {message.type === "file" && (
              <a href={message.mediaUrl} target="_blank" rel="noreferrer" className="underline">
                Download file
              </a>
            )}
          </>
        )}

        <div className={`mt-1 flex items-center gap-1 text-[10px] ${isMine ? "text-white/70" : "text-gray-400"}`}>
          <span>{time}</span>
          {isMine &&
            (message.pending ? (
              <Clock size={11} />
            ) : (
              <CheckCheck size={12} />
            ))}
        </div>

        {message.reactions?.length > 0 && (
          <div className="mt-1 flex gap-0.5">
            {message.reactions.map((r, i) => (
              <span key={i} className="text-xs">
                {r.emoji}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
