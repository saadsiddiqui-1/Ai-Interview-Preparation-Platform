const mongoose = require("mongoose");

const resumeAnalysisSchema = new mongoose.Schema(
  {
    skills: { type: [String], default: [] },
    education: { type: [String], default: [] },
    experience: { type: [String], default: [] },
    keywords: { type: [String], default: [] },
    rawText: { type: String, required: true },
  },
  { _id: false }
);

const resumeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  fileName: { type: String, required: true, trim: true },
  storedFileName: { type: String, required: true },
  filePath: { type: String, required: true },
  mimeType: { type: String, required: true },
  interviewPreferences: {
    role: { type: String, default: "Not selected" },
    experienceLevel: { type: String, default: "Not selected" },
    difficulty: { type: String, default: "Not selected" },
  },
  analysis: { type: resumeAnalysisSchema, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Resume", resumeSchema);
