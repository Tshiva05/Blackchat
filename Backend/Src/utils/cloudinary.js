const cloudinary = require("cloudinary").v2;
const env = require("../config/env");

if (env.cloudinary.cloudName) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

/**
 * Uploads a buffer (from multer memoryStorage) to Cloudinary.
 * Returns { url, publicId, resourceType }.
 */
function uploadBuffer(buffer, { folder = "chat-app", resourceType = "auto" } = {}) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id, resourceType: result.resource_type });
      }
    );
    stream.end(buffer);
  });
}

module.exports = { cloudinary, uploadBuffer };
