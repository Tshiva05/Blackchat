const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

// POST /api/chats/direct  { targetUserId }  -> get existing or create new direct chat
async function createOrGetDirectChat(req, res, next) {
  try {
    const { targetUserId } = req.body;
    if (!targetUserId) return res.status(400).json({ message: "targetUserId is required." });
    if (targetUserId === req.user._id.toString()) {
      return res.status(400).json({ message: "You can't start a chat with yourself." });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) return res.status(404).json({ message: "User not found." });

    let chat = await Chat.findOne({
      type: "direct",
      participants: { $all: [req.user._id, targetUserId], $size: 2 },
    });

    if (!chat) {
      chat = await Chat.create({
        type: "direct",
        participants: [req.user._id, targetUserId],
        createdBy: req.user._id,
      });
    }

    res.status(201).json({ chat });
  } catch (err) {
    next(err);
  }
}

// POST /api/chats/group  { name, participantIds: [] }
async function createGroupChat(req, res, next) {
  try {
    const { name, participantIds = [] } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ message: "Group name is required." });

    const uniqueParticipants = Array.from(new Set([...participantIds, req.user._id.toString()]));
    if (uniqueParticipants.length < 3) {
      return res.status(400).json({ message: "A group needs at least 2 other members." });
    }

    const chat = await Chat.create({
      type: "group",
      groupName: name.trim(),
      participants: uniqueParticipants,
      groupAdmins: [req.user._id],
      createdBy: req.user._id,
    });

    res.status(201).json({ chat });
  } catch (err) {
    next(err);
  }
}

// GET /api/chats  -> list all chats for the current user, with last message + unread count
async function listChats(req, res, next) {
  try {
    const chats = await Chat.find({ participants: req.user._id, archivedBy: { $ne: req.user._id } })
      .sort({ lastMessageAt: -1 })
      .populate("participants", "name username displayName chatId profilePicture isOnline lastSeen privacy")
      .populate("lastMessage");

    const withUnread = await Promise.all(
      chats.map(async (chat) => {
        const clearedAt = chat.clearedAt?.get(req.user._id.toString());
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.user._id },
          readBy: { $not: { $elemMatch: { user: req.user._id } } },
          ...(clearedAt && { createdAt: { $gt: clearedAt } }),
        });
        return { ...chat.toObject(), unreadCount, isPinned: chat.pinnedBy.includes(req.user._id) };
      })
    );

    res.json({ chats: withUnread });
  } catch (err) {
    next(err);
  }
}

// POST /api/chats/:chatId/clear  -> "erase the chat" (clears for this user only, WhatsApp-style)
async function clearChat(req, res, next) {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found." });

    chat.clearedAt.set(req.user._id.toString(), new Date());
    await chat.save();

    res.json({ message: "Chat erased.", clearedAt: chat.clearedAt.get(req.user._id.toString()) });
  } catch (err) {
    next(err);
  }
}

async function togglePin(req, res, next) {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found." });

    const uid = req.user._id.toString();
    const isPinned = chat.pinnedBy.map(String).includes(uid);
    chat.pinnedBy = isPinned
      ? chat.pinnedBy.filter((id) => id.toString() !== uid)
      : [...chat.pinnedBy, req.user._id];
    await chat.save();
    res.json({ isPinned: !isPinned });
  } catch (err) {
    next(err);
  }
}

async function toggleArchive(req, res, next) {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found." });

    const uid = req.user._id.toString();
    const isArchived = chat.archivedBy.map(String).includes(uid);
    chat.archivedBy = isArchived
      ? chat.archivedBy.filter((id) => id.toString() !== uid)
      : [...chat.archivedBy, req.user._id];
    await chat.save();
    res.json({ isArchived: !isArchived });
  } catch (err) {
    next(err);
  }
}

async function toggleMute(req, res, next) {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, participants: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found." });

    const uid = req.user._id.toString();
    const isMuted = chat.mutedBy.map(String).includes(uid);
    chat.mutedBy = isMuted
      ? chat.mutedBy.filter((id) => id.toString() !== uid)
      : [...chat.mutedBy, req.user._id];
    await chat.save();
    res.json({ isMuted: !isMuted });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createOrGetDirectChat,
  createGroupChat,
  listChats,
  clearChat,
  togglePin,
  toggleArchive,
  toggleMute,
};
