const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["direct", "group"], required: true },

    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }],

    // Group-only fields
    groupName: { type: String, trim: true },
    groupAvatar: { type: String, default: "" },
    groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    lastMessageAt: { type: Date, default: Date.now },

    // Per-user "clear chat" cutoff — messages created before this timestamp
    // are hidden from that user's view without touching every message doc.
    // Map<userId(string), Date>
    clearedAt: { type: Map, of: Date, default: {} },

    pinnedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    archivedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    mutedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

chatSchema.index({ participants: 1 });

module.exports = mongoose.model("Chat", chatSchema);
                   
