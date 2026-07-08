const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");

const User = require("../models/User");
const OtpToken = require("../models/OtpToken");
const { generateOtpCode, hashOtp, sendOtp } = require("../utils/sendOtp");
const { generateUniqueChatId } = require("../utils/generateId");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
} = require("../utils/tokens");
const env = require("../config/env");

function detectChannel(identifier) {
  return identifier.includes("@") ? "email" : "mobile";
}

function refreshCookieOptions() {
  // Render will host the frontend and backend on two different subdomains
  // (e.g. chat-frontend.onrender.com / chat-backend.onrender.com), which
  // counts as "cross-site" to the browser. Cross-site cookies require
  // SameSite=None + Secure, whereas same-site (e.g. local dev on localhost)
  // needs SameSite=Lax and doesn't require HTTPS. CROSS_SITE_COOKIES lets you
  // control this explicitly instead of guessing from NODE_ENV.
  const crossSite = env.crossSiteCookies;
  return {
    httpOnly: true,
    secure: crossSite || env.nodeEnv === "production",
    sameSite: crossSite ? "none" : "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: "/api/auth",
  };
}

// ---------- Step 1: request an OTP for registration ----------
async function requestRegisterOtp(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const identifier = req.body.identifier.trim().toLowerCase();
    const channel = detectChannel(identifier);

    const existingUser = await User.findOne(
      channel === "email" ? { email: identifier } : { mobile: identifier }
    );
    if (existingUser) {
      return res.status(409).json({ message: "An account already exists for this identifier." });
    }

    const code = generateOtpCode();
    const otpHash = hashOtp(code);
    const expiresAt = new Date(Date.now() + env.otp.expiresMinutes * 60 * 1000);

    await OtpToken.create({ identifier, channel, otpHash, purpose: "register", expiresAt });
    await sendOtp(identifier, channel, code);

    res.json({ message: `OTP sent via ${channel}.`, expiresInMinutes: env.otp.expiresMinutes });
  } catch (err) {
    next(err);
  }
}

// ---------- Step 2: verify OTP + create the account ----------
async function verifyRegisterOtp(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { otp, name, username, password } = req.body;
    const identifier = req.body.identifier.trim().toLowerCase();
    const channel = detectChannel(identifier);

    const record = await OtpToken.findOne({
      identifier,
      channel,
      purpose: "register",
      consumed: false,
    }).sort({ createdAt: -1 });

    if (!record) return res.status(400).json({ message: "No pending OTP. Request a new one." });
    if (record.expiresAt < new Date()) return res.status(400).json({ message: "OTP expired." });
    if (record.attempts >= 5) return res.status(429).json({ message: "Too many attempts. Request a new OTP." });

    if (hashOtp(otp) !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      return res.status(400).json({ message: "Incorrect OTP." });
    }

    const usernameTaken = await User.exists({ username: username.toLowerCase() });
    if (usernameTaken) return res.status(409).json({ message: "Username already taken." });

    const chatId = await generateUniqueChatId();
    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      chatId,
      name,
      username: username.toLowerCase(),
      displayName: name,
      passwordHash,
      ...(channel === "email" ? { email: identifier } : { mobile: identifier }),
    });

    record.consumed = true;
    await record.save();

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokens.push(hashToken(refreshToken));
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshCookieOptions());
    res.status(201).json({
      message: "Account created.",
      accessToken,
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

// ---------- Password login ----------
async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const identifier = req.body.identifier.trim().toLowerCase();
    const { password } = req.body;

    const user = await User.findOne({
      $or: [{ email: identifier }, { mobile: identifier }, { username: identifier }, { chatId: identifier }],
    });
    if (!user) return res.status(401).json({ message: "Invalid credentials." });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials." });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    user.refreshTokens.push(hashToken(refreshToken));
    user.isOnline = true;
    await user.save();

    res.cookie("refreshToken", refreshToken, refreshCookieOptions());
    res.json({ accessToken, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ---------- Rotate refresh token -> new access token ----------
async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token." });

    const payload = verifyRefreshToken(token);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ message: "User not found." });

    const tokenHash = hashToken(token);
    if (!user.refreshTokens.includes(tokenHash)) {
      return res.status(401).json({ message: "Refresh token revoked." });
    }

    // Rotate: remove old, issue new
    user.refreshTokens = user.refreshTokens.filter((t) => t !== tokenHash);
    const newRefreshToken = signRefreshToken(user);
    user.refreshTokens.push(hashToken(newRefreshToken));
    await user.save();

    const accessToken = signAccessToken(user);
    res.cookie("refreshToken", newRefreshToken, refreshCookieOptions());
    res.json({ accessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid refresh token." });
  }
}

async function logout(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (token) {
      // Best-effort cleanup; ignore errors from an already-invalid token
      try {
        const decoded = verifyRefreshToken(token);
        const user = await User.findById(decoded.sub);
        if (user) {
          user.refreshTokens = user.refreshTokens.filter((t) => t !== hashToken(token));
          user.isOnline = false;
          user.lastSeen = new Date();
          await user.save();
        }
      } catch (e) {
        /* token already invalid — nothing to clean up */
      }
    }
    res.clearCookie("refreshToken", { path: "/api/auth", sameSite: refreshCookieOptions().sameSite, secure: refreshCookieOptions().secure });
    res.json({ message: "Logged out." });
  } catch (err) {
    next(err);
  }
}

module.exports = { requestRegisterOtp, verifyRegisterOtp, login, refresh, logout };
  
