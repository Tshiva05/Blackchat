const express = require("express");
const { requireAuth } = require("../middleware/auth");
const chats = require("../controllers/chatController");
const messages = require("../controllers/messageController");

const router = express.Router();

router.use(requireAuth);

router.get("/", chats.listChats);
router.post("/direct", chats.createOrGetDirectChat);
router.post("/group", chats.createGroupChat);

router.post("/:chatId/clear", chats.clearChat); // "erase the chat"
router.post("/:chatId/pin", chats.togglePin);
router.post("/:chatId/archive", chats.toggleArchive);
router.post("/:chatId/mute", chats.toggleMute);

router.get("/:chatId/messages", messages.getMessages);

module.exports = router;
