const express = require("express");
const { requireAuth } = require("../middleware/auth");
const users = require("../controllers/userController");

const router = express.Router();

router.use(requireAuth);

router.get("/me", users.getMe);
router.patch("/me", users.updateMe);
router.patch("/me/privacy", users.updatePrivacy);
router.patch("/me/settings", users.updateSettings);

router.get("/voice-commands", users.getVoiceCommands);
router.put("/voice-commands", users.updateVoiceCommands);

router.get("/search", users.searchUsers);

router.post("/:userId/block", users.blockUser);
router.post("/:userId/unblock", users.unblockUser);

module.exports = router;
