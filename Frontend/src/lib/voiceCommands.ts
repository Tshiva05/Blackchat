import { CustomVoiceCommand, VoiceAction } from "@/types";

// Built-in default trigger phrases for every supported action.
// Users can add their own phrases on top of these (see mergeCommandPhrases),
// e.g. mapping "erase_chat" to also fire on "destroy" or "clear everything".
export const DEFAULT_PHRASES: Record<VoiceAction, string[]> = {
  erase_chat: ["erase the chat", "erase chat", "clear the chat", "clear chat", "delete the chat"],
  delete_message: ["delete this message", "delete message", "remove this message"],
  call_user: ["call"], // followed by a name, e.g. "call john"
  open_settings: ["open settings", "go to settings", "show settings"],
  mute_notifications: ["mute notifications", "mute this chat", "turn off notifications"],
  search_user: ["search user", "search", "find user", "open id"], // followed by an id/name
  send_message: ["send message", "send", "say"], // followed by message text
  create_group: ["create group", "new group", "start a group"],
  record_voice_note: ["record voice note", "record a voice note", "start recording"],
  dark_mode: ["dark mode", "enable dark mode", "switch to dark mode", "light mode", "toggle theme"],
  logout: ["log out", "logout", "sign out"],
};

export interface ParsedCommand {
  action: VoiceAction;
  /** Whatever text followed the trigger phrase, e.g. "call john" -> "john" */
  argument: string;
  matchedPhrase: string;
}

/** Merge built-in phrases with the user's custom phrases for each action. */
export function buildPhraseMap(custom: CustomVoiceCommand[]): Record<VoiceAction, string[]> {
  const map: Record<string, string[]> = JSON.parse(JSON.stringify(DEFAULT_PHRASES));
  for (const entry of custom) {
    if (!map[entry.action]) map[entry.action] = [];
    for (const phrase of entry.phrases) {
      const normalized = phrase.trim().toLowerCase();
      if (normalized && !map[entry.action].includes(normalized)) {
        map[entry.action].push(normalized);
      }
    }
  }
  return map as Record<VoiceAction, string[]>;
}

/**
 * Matches a raw speech transcript against the phrase map.
 * Picks the longest matching phrase so more specific commands win
 * (e.g. "search user 123" over the bare "search").
 */
export function matchCommand(
  transcript: string,
  phraseMap: Record<VoiceAction, string[]>
): ParsedCommand | null {
  const text = transcript.trim().toLowerCase();
  let best: ParsedCommand | null = null;

  (Object.keys(phraseMap) as VoiceAction[]).forEach((action) => {
    phraseMap[action].forEach((phrase) => {
      if (text === phrase || text.startsWith(phrase + " ") || text.includes(" " + phrase)) {
        const idx = text.indexOf(phrase);
        const argument = (text.slice(0, idx) + text.slice(idx + phrase.length)).trim();
        if (!best || phrase.length > best.matchedPhrase.length) {
          best = { action, argument, matchedPhrase: phrase };
        }
      }
    });
  });

  return best;
}
