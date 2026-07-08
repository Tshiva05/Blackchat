require("dotenv").config();

function required(name, fallback) {
  const val = process.env[name] ?? fallback;
  if (val === undefined) {
    // eslint-disable-next-line no-console
    console.warn(`[env] Warning: ${name} is not set.`);
  }
  return val;
}

module.exports = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
  // Set to "true" when frontend and backend are on different domains (e.g.
  // two separate Render services). Leave unset/"false" for local dev where
  // both run on localhost.
  crossSiteCookies: process.env.CROSS_SITE_COOKIES === "true",

  mongoUri: required("MONGODB_URI"),

  jwt: {
    accessSecret: required("JWT_ACCESS_SECRET", "dev_access_secret"),
    refreshSecret: required("JWT_REFRESH_SECRET", "dev_refresh_secret"),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
  },

  otp: {
    expiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 5),
  },

  smtp: {
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM || "Chat App <no-reply@chatapp.com>",
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  rateLimit: {
    windowMinutes: Number(process.env.RATE_LIMIT_WINDOW_MINUTES || 15),
    maxRequests: Number(process.env.RATE_LIMIT_MAX_REQUESTS || 200),
  },
};
