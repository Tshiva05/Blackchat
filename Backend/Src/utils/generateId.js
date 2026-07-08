const User = require("../models/User");

/**
 * Generates a permanent, unique 8-digit numeric chat ID.
 * Retries on the rare collision until a free one is found.
 */
async function generateUniqueChatId() {
  const MAX_ATTEMPTS = 10;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const candidate = String(Math.floor(10000000 + Math.random() * 90000000));
    // eslint-disable-next-line no-await-in-loop
    const exists = await User.exists({ chatId: candidate });
    if (!exists) return candidate;
  }
  throw new Error("Could not generate a unique chat ID, please retry.");
}

module.exports = { generateUniqueChatId };
