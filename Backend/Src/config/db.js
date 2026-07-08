const mongoose = require("mongoose");
const env = require("./env");

async function connectDB() {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.mongoUri);
    // eslint-disable-next-line no-console
    console.log("[db] Connected to MongoDB Atlas");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("[db] Connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;

