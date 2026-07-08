const Chat = require("../models/Chat");
const Message = require("../models/Message");

// BUGFIX: react/star/delete/forward previously loaded a message by id alone
// and never checked whether the requester actually belonged to that
// message's chat, letting any authenticated user act on any message in the
// system (IDOR). This helper centralizes that membership check.
async function assertParticipant(chatId, userId) {
  const chat = await Chat.findOne({ _id: chatId, participants: userId });
  return chat;
}

// GET /api/chats/:chatId/messages?before=<messageId>&limit=30
async function getMessages(req, res, next) {
  try {
    const { chatId } = req.params;
    const limit = Math.min(Number(req.query.limit) || 30, 100);

    const chat = await Chat.findOne({ _id: chatId, participants: req.user._id });
    if (!chat) return res.status(404).json({ message: "Chat not found." });

    const clearedAt = chat.clearedAt?.get(req.user._id.toString());

    const query = {
      chat: chatId,
      deletedFor: { $ne: req.user._id },
      ...(clearedAt && { createdAt: { $gt: clearedAt } }),
    };

    if (req.query.before) {
      const beforeMsg = await Message.findById(req.query.before);
      if (beforeMsg) query.createdAt = { ...(query.createdAt || {}), $lt: beforeMsg.createdAt };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("sender", "name username displayName profilePicture chatId")
      .populate("replyTo");

    res.json({ messages: messages.reverse() });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/messages/:id/react  { emoji }
async function reactToMessage(req, res, next) {
  try {
    const { emoji } = req.body;
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found." });

    if (!(await assertParticipant(message.chat, req.user._id))) {
      return res.status(403).json({ message: "You don't have access to this message." });
    }

    const uid = req.user._id.toString();
    const existingIdx = message.reactions.findIndex((r) => r.user.toString() === uid);
    if (existingIdx >= 0 && message.reactions[existingIdx].emoji === emoji) {
      message.reactions.splice(existingIdx, 1); // toggle off
    } else if (existingIdx >= 0) {
      message.reactions[existingIdx].emoji = emoji;
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }
    await message.save();
    res.json({ reactions: message.reactions });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/messages/:id/star
async function toggleStar(req, res, next) {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found." });

    if (!(await assertParticipant(message.chat, req.user._id))) {
      return res.status(403).json({ message: "You don't have access to this message." });
    }

    const uid = req.user._id.toString();
    const isStarred = message.starredBy.map(String).includes(uid);
    message.starredBy = isStarred
      ? message.starredBy.filter((id) => id.toString() !== uid)
      : [...message.starredBy, req.user._id];
    await message.save();
    res.json({ isStarred: !isStarred });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/messages/:id?mode=me|everyone
async function deleteMessage(req, res, next) {
  try {
    const mode = req.query.mode === "everyone" ? "everyone" : "me";
    const message = await Message.findById(req.params.id);
    if (!message) return res.status(404).json({ message: "Message not found." });

    if (!(await assertParticipant(message.chat, req.user._id))) {
      return res.status(403).json({ message: "You don't have access to this message." });
    }

    if (mode === "everyone") {
      if (message.sender.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "You can only delete your own messages for everyone." });
      }
      message.deletedForEveryone = true;
      message.content = "";
      message.mediaUrl = "";
    } else {
      if (!message.deletedFor.map(String).includes(req.user._id.toString())) {
        message.deletedFor.push(req.user._id);
      }
    }
    await message.save();
    res.json({ message: "Deleted.", mode });
  } catch (err) {
    next(err);
  }
}

// POST /api/messages/:id/forward  { chatIds: [] }
async function forwardMessage(req, res, next) {
  try {
    const { chatIds = [] } = req.body;
    const original = await Message.findById(req.params.id);
    if (!original) return res.status(404).json({ message: "Message not found." });

    if (!(await assertParticipant(original.chat, req.user._id))) {
      return res.status(403).json({ message: "You don't have access to this message." });
    }

    // BUGFIX: only forward into chats the requester is actually a member
    // of — previously any chatId supplied by the client was trusted,
    // letting a user inject a message into a chat they don't belong to.
    const allowedChats = await Chat.find({
      _id: { $in: chatIds },
      participants: req.user._id,
    }).select("_id");
    const allowedChatIds = allowedChats.map((c) => c._id.toString());
    const deniedChatIds = chatIds.filter((id) => !allowedChatIds.includes(id.toString()));

    const forwarded = await Promise.all(
      allowedChatIds.map((chatId) =>
        Message.create({
          chat: chatId,
          sender: req.user._id,
          type: original.type,
          content: original.content,
          mediaUrl: original.mediaUrl,
          mediaMeta: original.mediaMeta,
          forwardedFrom: original._id,
        })
      )
    );

    for (const chatId of allowedChatIds) {
      await Chat.findByIdAndUpdate(chatId, { lastMessageAt: new Date() });
    }

    res.status(201).json({ forwarded, deniedChatIds });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMessages, reactToMessage, toggleStar, deleteMessage, forwardMessage };
