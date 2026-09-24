const bcrypt = require("bcrypt");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Resume = require("../models/Resume");
const Interview = require("../models/Interview");
const Question = require("../models/Question");
const Answer = require("../models/Answer");
const { sendPasswordResetEmail, sendWelcomeEmail } = require("../services/emailService");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_REQUIREMENT_MESSAGE = "Password must be at least 8 characters and include an uppercase letter, a lowercase letter, and a special character.";

const createToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
const getUserRole = (user) => process.env.ADMIN_EMAIL?.trim().toLowerCase() === user.email.toLowerCase() ? "admin" : (user.role || "user");

const register = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }
    if (!PASSWORD_PATTERN.test(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_REQUIREMENT_MESSAGE });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "An account with this email already exists. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const role = process.env.ADMIN_EMAIL?.trim().toLowerCase() === email ? "admin" : "user";
    const user = await User.create({ name, email, password: hashedPassword, role });
    sendWelcomeEmail({ name: user.name, email: user.email }).catch((emailError) => {
      console.error("Welcome email could not be sent:", emailError.message);
    });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please log in.",
      user: { id: user._id, name: user.name, email: user.email, role: getUserRole(user) },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this email already exists. Please log in." });
    }
    return next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const genericMessage = "If an account exists for this email, a password reset link has been sent.";

    if (!email || !EMAIL_PATTERN.test(email)) {
      return res.status(400).json({ success: false, message: "Enter a valid email address." });
    }

    const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpires");
    if (!user) return res.json({ success: true, message: genericMessage });

    const resetToken = crypto.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000);
    await user.save({ validateBeforeSave: false });

    const clientUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
    const resetUrl = `${clientUrl}/reset-password/${resetToken}`;

    try {
      const delivery = await sendPasswordResetEmail({
        name: user.name,
        email: user.email,
        resetUrl,
      });
      if (!delivery.sent) {
        user.passwordResetToken = null;
        user.passwordResetExpires = null;
        await user.save({ validateBeforeSave: false });
        return res.status(503).json({
          success: false,
          message: "Email service is not configured yet. Please contact the administrator.",
        });
      }
    } catch (emailError) {
      user.passwordResetToken = null;
      user.passwordResetExpires = null;
      await user.save({ validateBeforeSave: false });
      return next(emailError);
    }

    return res.json({ success: true, message: genericMessage });
  } catch (error) {
    return next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;

    if (!password || !PASSWORD_PATTERN.test(password)) {
      return res.status(400).json({ success: false, message: PASSWORD_REQUIREMENT_MESSAGE });
    }
    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, message: "Passwords do not match." });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() },
    }).select("+password +passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "This reset link is invalid or has expired. Request a new link.",
      });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    await user.save();

    return res.json({ success: true, message: "Password reset successfully. You can now log in." });
  } catch (error) {
    return next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found. Please create an account first." });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ success: false, message: "Incorrect password. Please try again." });
    }

    return res.json({
      success: true,
      message: "Login successful.",
      token: createToken(user._id.toString()),
      user: { id: user._id, name: user.name, email: user.email, role: getUserRole(user) },
    });
  } catch (error) {
    return next(error);
  }
};

const deleteAccount = async (req, res, next) => {
  try {
    const password = req.body.password;
    if (!password) return res.status(400).json({ success: false, message: "Enter your password to delete your account." });

    const user = await User.findById(req.user.id).select("+password");
    if (!user) return res.status(404).json({ success: false, message: "Account not found." });
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ success: false, message: "Incorrect password. Account was not deleted." });
    }

    const interviews = await Interview.find({ userId: user._id }).select("_id");
    const interviewIds = interviews.map((interview) => interview._id);
    const resumes = await Resume.find({ userId: user._id }).select("storedFileName");
    await Promise.all(resumes.map((resume) => fs.promises.unlink(
      path.join(__dirname, "..", "uploads", resume.storedFileName),
    ).catch(() => undefined)));
    await Answer.deleteMany({ userId: user._id });
    await Question.deleteMany({ interviewId: { $in: interviewIds } });
    await Interview.deleteMany({ userId: user._id });
    await Resume.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });

    return res.json({ success: true, message: "Your account and associated data have been permanently deleted." });
  } catch (error) {
    return next(error);
  }
};

module.exports = { deleteAccount, forgotPassword, login, register, resetPassword };
