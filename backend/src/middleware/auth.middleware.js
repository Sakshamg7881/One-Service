/**
 * OneService – Auth Middleware
 */
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

/**
 * Protect routes – verify JWT access token
 */
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: "Not authenticated. Token missing." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password -otp");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "User not found or inactive." });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Token expired.", code: "TOKEN_EXPIRED" });
    }
    return res.status(401).json({ success: false, message: "Invalid token." });
  }
};

/**
 * Role-based authorization
 * Usage: authorize("admin"), authorize("vendor", "admin")
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized.`,
      });
    }
    next();
  };
};
