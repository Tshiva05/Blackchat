export interface User {
  id: string;
  chatId: string;
  name: string;
  username: string;
  displayName: string;
  profilePicture?: string;
  bio?: string;
  status?: string;
  isOnline?: boolean;
  lastSeen?: string;
  email?: string;
  mobile?: string;
  privacy?: PrivacySettings;
  settings?: UserSettings;
}

export interface PrivacySettings {
  hideOnlineStatus: boolean;
  hideLastSeen: boolean;
  hideProfilePicture: boolean;
  hideMobile: boolean;
  disableSearchByMobile: boolean;
}

export interface UserSettings {
  theme: "light" | "dark" | "amoled";
  accentColor: string;
  fontSize: "small" | "medium" | "large";
  language: string;
  voiceCommandsEnabled: boolean;
}

export type VoiceAction =
  | "erase_chat"
  | "delete_message"
  | "call_user"
  | "open_settings"
  | "mute_notifications"
  | "search_user"
  | "send_message"
  | "create_group"
  | "record_voice_note"
  | "dark_mode"
  | "logout";

export interface CustomVoiceCommand {
  action: VoiceAction;
  phrases: string[];
}

export interface Chat {
  _id: string;
  type: "direct" | "group";
  participants: User[];
  groupName?: string;
  groupAvatar?: string;
  lastMessage?: Message;
  lastMessageAt: string;
  unreadCount?: number;
  isPinned?: boolean;
}

export interface Message {
  _id: string;
  chat: string;
  sender: User;
  type: "text" | "image" | "video" | "audio" | "voice_note" | "file" | "location" | "contact";
  content: string;
  mediaUrl?: string;
  replyTo?: Message | null;
  reactions: { user: string; emoji: string }[];
  starredBy: string[];
  deletedForEveryone: boolean;
  createdAt: string;
  tempId?: string;
  pending?: boolean;
}
