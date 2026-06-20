/**
 * OneService – Main Server Entry Point
 * Production-ready Express + Socket.io server
 */
require("dotenv").config();
const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const initSocket = require("./socket/socketManager");

const PORT = process.env.PORT || 5000;

// ── Connect Database ────────────────────────────────────────────────────────
connectDB();

// ── Create HTTP server ──────────────────────────────────────────────────────
const server = http.createServer(app);

// ── Attach Socket.io ────────────────────────────────────────────────────────
initSocket(server);

// ── Start Listening ─────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`✅ OneService backend running on port ${PORT} [${process.env.NODE_ENV}]`);
});

// ── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});
