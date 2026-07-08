const { verifyAccessToken } = require("../utils/tokens");
const User = require("../models/User");
const Chat = require("../models/Chat");
const Message = require("../models/Message");

// Tracks which socket IDs belong to which user (supports multi-device: one user, many sockets)
const userSockets = new Map(); // userId -> Set<socketId>

function registerSocket(userId, socketId) {
  if (!userSockets.has(userId)) userSockets.set(userId, new Set());
  userSockets.get(userId).add(socketId);
}
function unregisterSocket(userId, socketId) {
  userSockets.get(userId)?.delete(socketId);
  if (userSockets.get(userId)?.size === 0) userSockets.delete(userId);
}
function isUserOnline(userId) {
  return userSockets.has(userId);
}

function initSocket(io) {
  // Auth every socket connection with the same JWT access token used for REST
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("No auth token."));
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.sub);
      if (!user) return next(new Error("User not found."));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid or expired token."));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.user._id.toString();
    registerSocket(userId, socket.id);

    await User.findByIdAndUpdate(userId, { isOnline: true });
    socket.broadcast.emit("presence:update", { userId, isOnline: true });

    // Join a room per chat so messages fan out only to participants.
    // BUGFIX: this previously joined the room for ANY chatId with no check
    // that the socket's user was actually a participant, letting anyone
    // eavesdrop on any chat's messages/typing/clear events in real time.
    socket.on("chat:join", async (chatId) => {
      const chat = await Chat.findOne({ _id: chatId, participants: userId });
      if (!chat) return;
      socket.join(`chat:${chatId}`);
    });
    socket.on("chat:leave", (chatId) => {
      socket.leave(`chat:${chatId}`);
    });

    // ---- Sending a message ----
    socket.on("message:send", async (payload, ack) => {
      try {
        const { chatId, tempId, type = "text", content = "", mediaUrl = "", mediaMeta, replyTo } = payload;

        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) return ack?.({ error: "Chat not found or access denied." });

        const message = await Message.create({
          chat: chatId,
          sender: userId,
          type,
          content,
          mediaUrl,
          mediaMeta,
          replyTo: replyTo || null,
          deliveredTo: [{ user: userId, at: new Date() }],
        });

        chat.lastMessage = message._id;
        chat.lastMessageAt = message.createdAt;
        await chat.save();

        const populated = await message.populate("sender", "name username displayName profilePicture chatId");

        io.to(`chat:${chatId}`).emit("message:new", { message: populated, tempId });
        ack?.({ message: populated, tempId });
      } catch (err) {
        ack?.({ error: err.message });
      }
    });

    // ---- Typing indicators ----
    socket.on("typing:start", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("typing:update", { chatId, userId, isTyping: true });
    });
    socket.on("typing:stop", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("typing:update", { chatId, userId, isTyping: false });
    });

    // ---- Read receipts ----
    socket.on("message:read", async ({ chatId, messageIds }) => {
      try {
        // BUGFIX: verify the user is actually a participant of this chat
        // before letting them mark its messages as read.
        const chat = await Chat.findOne({ _id: chatId, participants: userId });
        if (!chat) return;

        await Message.updateMany(
          { _id: { $in: messageIds }, chat: chatId, "readBy.user": { $ne: userId } },
          { $push: { readBy: { user: userId, at: new Date() } } }
        );
        io.to(`chat:${chatId}`).emit("message:read:update", { chatId, messageIds, userId });
      } catch (err) {
        /* non-critical, ignore */
      }
    });

    // ---- Voice-command-triggered "erase chat" broadcast ----
    // (the REST endpoint does the actual clearing; this just tells the other
    // participant's open tab to refresh state instantly)
    socket.on("chat:cleared", ({ chatId }) => {
      socket.to(`chat:${chatId}`).emit("chat:cleared", { chatId, by: userId });
    });

    socket.on("disconnect", async () => {
      unregisterSocket(userId, socket.id);
      if (!isUserOnline(userId)) {
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen: new Date() });
        socket.broadcast.emit("presence:update", { userId, isOnline: false, lastSeen: new Date() });
      }
    });
  });
}

module.exports = { initSocket, isUserOnline };
              
