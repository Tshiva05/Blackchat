const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const receiptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    type: {
      type: String,
      enum: ["text", "image", "video", "audio", "voice_note", "file", "location", "contact"],
      default: "text",
    },
    content: { type: String, default: "" }, // text body or location/contact payload (JSON string)
    mediaUrl: { type: String, default: "" },
    mediaMeta: {
      fileName: String,
      fileSize: Number,
      mimeType: String,
      durationSeconds: Number,
    },

    replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
    forwardedFrom: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },

    reactions: { type: [reactionSchema], default: [] },

    deliveredTo: { type: [receiptSchema], default: [] },
    readBy: { type: [receiptSchema], default: [] },

    starredBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    deletedForEveryone: { type: Boolean, default: false },

    editedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
