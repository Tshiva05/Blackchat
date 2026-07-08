const crypto = require("crypto");
const nodemailer = require("nodemailer");
const env = require("../config/env");

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

function hashOtp(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

let transporter = null;
function getTransporter() {
  if (!transporter && env.smtp.host && env.smtp.user) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
}

/**
 * Sends an OTP code to an email address or mobile number.
 * In development (or if no provider credentials are configured), the code
 * is logged to the server console instead of actually being sent — this
 * keeps the app fully testable without a paid email/SMS provider.
 *
 * To go live:
 *  - Email: fill SMTP_* in .env (any SMTP provider, e.g. Gmail app password, SendGrid SMTP)
 *  - SMS: fill TWILIO_* in .env and uncomment the Twilio block below
 */
async function sendOtp(identifier, channel, code) {
  if (env.nodeEnv !== "production") {
    // eslint-disable-next-line no-console
    console.log(`\n[OTP][DEV MODE] Code for ${identifier} (${channel}): ${code}\n`);
  }

  if (channel === "email") {
    const t = getTransporter();
    if (t) {
      await t.sendMail({
        from: env.smtp.from,
        to: identifier,
        subject: "Your verification code",
        text: `Your verification code is ${code}. It expires in ${env.otp.expiresMinutes} minutes.`,
      });
    }
    return;
  }

  if (channel === "mobile") {
    if (env.twilio.accountSid && env.twilio.authToken) {
      // Uncomment once the twilio package is installed and credentials are set:
      //
      // const twilio = require("twilio")(env.twilio.accountSid, env.twilio.authToken);
      // await twilio.messages.create({
      //   body: `Your verification code is ${code}`,
      //   from: env.twilio.phoneNumber,
      //   to: identifier,
      // });
    }
    return;
  }
}

module.exports = { generateOtpCode, hashOtp, sendOtp };
