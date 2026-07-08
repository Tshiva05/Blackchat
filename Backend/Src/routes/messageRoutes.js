const express = require("express");
const { requireAuth } = require("../middleware/auth");
const messages = require("../controllers/messageController");

const router = express.Router();

router.use(requireAuth);

router.patch("/:id/react", messages.reactToMessage);
router.patch("/:id/star", messages.toggleStar);
router.delete("/:id", messages.deleteMessage);
router.post("/:id/forward", messages.forwardMessage);

module.exports = router;
