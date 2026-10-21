/**
 * OneService – MongoDB Connection
 * Improved resilience: fallback to local MongoDB when MONGODB_URI appears missing/invalid,
 * and retry on failure instead of exiting the process immediately.
 */
const mongoose = require("mongoose");

const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI;
  let uri = rawUri;

  // If the environment variable is missing or clearly masked, fall back to a local DB for dev.
  if (
    !uri ||
    uri.includes("******") ||
    (!uri.startsWith("mongodb://") && !uri.startsWith("mongodb+srv://"))
  ) {
    console.warn(
      "MONGODB_URI is not set or looks invalid. Falling back to local: mongodb://127.0.0.1:27017/oneservice"
    );
    uri = "mongodb://127.0.0.1:27017/oneservice";
  }

  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000, // fail fast when unreachable
  };

  try {
    console.log("Attempting MongoDB connection to:", uri);
    const conn = await mongoose.connect(uri, options);
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected. Will attempt to reconnect...");
      // Let mongoose reconnect automatically using the connection options above.
    });
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("Retrying connection in 5 seconds...");
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;
