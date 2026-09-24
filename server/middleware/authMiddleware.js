const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Please log in to continue." });
    }

    const token = authorization.slice(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.userId).select("_id name email role");

    if (!user) {
      return res.status(401).json({ success: false, message: "Your account no longer exists." });
    }

    const isConfiguredAdmin = process.env.ADMIN_EMAIL?.trim().toLowerCase() === user.email.toLowerCase();
    req.user = { id: user._id.toString(), name: user.name, email: user.email, role: isConfiguredAdmin ? "admin" : (user.role || "user") };
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Your session is invalid or expired. Please log in again." });
    }
    return next(error);
  }
};

module.exports = { protect };
