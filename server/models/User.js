const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  password: { type: String, required: true, select: false },
  passwordResetToken: { type: String, select: false, default: null },
  passwordResetExpires: { type: Date, select: false, default: null },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
