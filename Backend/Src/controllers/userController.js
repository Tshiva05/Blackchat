const User = require("../models/User");

async function getMe(req, res) {
  res.json({ user: req.user.toPublicJSON({ isSelf: true }) });
}
// (isSelf: true reveals email/mobile/privacy/settings that are otherwise hidden from other users)

async function updateMe(req, res, next) {
  try {
    const allowed = ["name", "displayName", "bio", "status", "profilePicture"];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) req.user[field] = req.body[field];
    });
    await req.user.save();
    res.json({ user: req.user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

async function updatePrivacy(req, res, next) {
  try {
    const fields = [
      "hideOnlineStatus",
      "hideLastSeen",
      "hideProfilePicture",
      "hideMobile",
      "disableSearchByMobile",
    ];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) req.user.privacy[field] = req.body[field];
    });
    await req.user.save();
    res.json({ privacy: req.user.privacy });
  } catch (err) {
    next(err);
  }
}

async function updateSettings(req, res, next) {
  try {
    const fields = ["theme", "accentColor", "fontSize", "language", "voiceCommandsEnabled"];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) req.user.settings[field] = req.body[field];
    });
    await req.user.save();
    res.json({ settings: req.user.settings });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/voice-commands
async function getVoiceCommands(req, res) {
  res.json({ customVoiceCommands: req.user.customVoiceCommands });
}

// PUT /api/users/voice-commands  { customVoiceCommands: [{action, phrases}] }
async function updateVoiceCommands(req, res, next) {
  try {
    const { customVoiceCommands } = req.body;
    if (!Array.isArray(customVoiceCommands)) {
      return res.status(400).json({ message: "customVoiceCommands must be an array." });
    }
    req.user.customVoiceCommands = customVoiceCommands;
    await req.user.save();
    res.json({ customVoiceCommands: req.user.customVoiceCommands });
  } catch (err) {
    next(err);
  }
}

// GET /api/users/search?q=...
// Matches by permanent chat ID (exact), username (partial), or mobile (exact, if allowed)
async function searchUsers(req, res, next) {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json({ results: [] });

    const orClauses = [
      { chatId: q },
      { username: new RegExp(`^${q.toLowerCase()}`, "i") },
    ];

    // Mobile search only matches users who haven't opted out of it
    orClauses.push({ mobile: q, "privacy.disableSearchByMobile": { $ne: true } });

    const results = await User.find({
      $or: orClauses,
      _id: { $ne: req.user._id },
      blockedUsers: { $ne: req.user._id },
    })
      .limit(20)
      .select("chatId name username displayName profilePicture privacy");

    res.json({
      results: results.map((u) => ({
        id: u._id,
        chatId: u.chatId,
        name: u.name,
        username: u.username,
        displayName: u.displayName || u.name,
        profilePicture: u.privacy?.hideProfilePicture ? "" : u.profilePicture,
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function blockUser(req, res, next) {
  try {
    const { userId } = req.params;
    if (!req.user.blockedUsers.includes(userId)) {
      req.user.blockedUsers.push(userId);
      await req.user.save();
    }
    res.json({ message: "User blocked." });
  } catch (err) {
    next(err);
  }
}

async function unblockUser(req, res, next) {
  try {
    const { userId } = req.params;
    req.user.blockedUsers = req.user.blockedUsers.filter((id) => id.toString() !== userId);
    await req.user.save();
    res.json({ message: "User unblocked." });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getMe,
  updateMe,
  updatePrivacy,
  updateSettings,
  getVoiceCommands,
  updateVoiceCommands,
  searchUsers,
  blockUser,
  unblockUser,
};
