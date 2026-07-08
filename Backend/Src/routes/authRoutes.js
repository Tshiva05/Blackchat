const express = require("express");
const { body } = require("express-validator");
const auth = require("../controllers/authController");
const { otpLimiter, apiLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

router.post(
  "/register/request-otp",
  otpLimiter,
  [body("identifier").notEmpty().withMessage("Email or mobile is required.")],
  auth.requestRegisterOtp
);

router.post(
  "/register/verify-otp",
  apiLimiter,
  [
    body("identifier").notEmpty(),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits."),
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("username")
      .trim()
      .isLength({ min: 3, max: 24 })
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage("Username must be 3-24 characters, letters/numbers/underscore only."),
    body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters."),
  ],
  auth.verifyRegisterOtp
);

router.post(
  "/login",
  apiLimiter,
  [body("identifier").notEmpty(), body("password").notEmpty()],
  auth.login
);

router.post("/refresh", auth.refresh);
router.post("/logout", auth.logout);

module.exports = router;
  
