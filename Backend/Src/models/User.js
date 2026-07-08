const mongoose = require("mongoose");

const voiceCommandSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        "erase_chat",
        "delete_message",
        "call_user",
        "open_settings",
        "mute_notifications",
        "search_user",
        "send_message",
        "create_group",
        "record_voice_note",
        "dark_mode",
        "logout",
      ],
    },
    // User-defined trigger phrases for this action, e.g. ["destroy", "clear everything"]
    phrases: { type: [String], default: [] },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    // Permanent numeric chat ID, generated once at registration, never changes.
    chatId: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 24,
    },
    displayName: { type: String, trim: true },

    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    mobile: { type: String, unique: true, sparse: true, trim: true },

    passwordHash: { type: String, required: true },

    profilePicture: { type: String, default: "" },
    bio: { type: String, default: "", maxlength: 160 },
    status: { type: String, default: "Hey there! I am using Chat App." },

    isOnline: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },

    privacy: {
      hideOnlineStatus: { type: Boolean, default: false },
      hideLastSeen: { type: Boolean, default: false },
      hideProfilePicture: { type: Boolean, default: false },
      hideMobile: { type: Boolean, default: true },
      disableSearchByMobile: { type: Boolean, default: false },
    },

    blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    settings: {
      theme: { type: String, enum: ["light", "dark", "amoled"], default: "dark" },
      accentColor: { type: String, default: "#6C5CE7" },
      fontSize: { type: String, enum: ["small", "medium", "large"], default: "medium" },
      language: { type: String, default: "en" },
      voiceCommandsEnabled: { type: Boolean, default: false },
    },

    customVoiceCommands: { type: [voiceCommandSchema], default: [] },

    refreshTokens: [{ type: String }], // hashed refresh tokens for multi-device support
  },
  { timestamps: true }
);

userSchema.methods.toPublicJSON = function ({ isSelf = false } = {}) {
  const base = {
    id: this._id,
    chatId: this.chatId,
    name: this.name,
    username: this.username,
    displayName: this.displayName || this.name,
    profilePicture: this.privacy?.hideProfilePicture && !isSelf ? "" : this.profilePicture,
    bio: this.bio,
    status: this.status,
    isOnline: this.privacy?.hideOnlineStatus && !isSelf ? undefined : this.isOnline,
    lastSeen: this.privacy?.hideLastSeen && !isSelf ? undefined : this.lastSeen,
  };
  if (isSelf) {
    base.email = this.email;
    base.mobile = this.mobile;
    base.privacy = this.privacy;
    base.settings = this.settings;
  }
  return base;
};

module.exports = mongoose.model("User", userSchema);
