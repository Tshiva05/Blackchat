const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");
const { uploadBuffer } = require("../utils/cloudinary");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// POST /api/upload  (multipart/form-data, field name: "file")
// Handles images, videos, audio/voice notes, PDFs, Word docs, ZIPs.
router.post("/", requireAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded." });

    const result = await uploadBuffer(req.file.buffer, {
      folder: `chat-app/${req.user.chatId}`,
    });

    res.status(201).json({
      url: result.url,
      resourceType: result.resourceType,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
