const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resume",
    required: true,
  },
  role: { type: String, required: true, trim: true, maxlength: 120 },
  type: {
    type: String,
    required: true,
    enum: ["HR", "Technical", "Behavioral", "Mixed"],
  },
  difficulty: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  questionCount: { type: Number, required: true, min: 5, max: 15 },
  generationSource: {
    type: String,
    enum: ["local", "gemini"],
    default: "local",
  },
  generationModel: { type: String, default: null },
  status: {
    type: String,
    enum: ["not_started", "in_progress", "completed"],
    default: "not_started",
  },
  score: { type: Number, default: null, min: 0, max: 100 },
  feedback: { type: String, default: "" },
  performanceReport: {
    answeredQuestions: { type: Number, default: 0, min: 0 },
    categoryScores: {
      correctness: { type: Number, default: null, min: 0, max: 100 },
      confidence: { type: Number, default: null, min: 0, max: 100 },
      communication: { type: Number, default: null, min: 0, max: 100 },
      technicalAccuracy: { type: Number, default: null, min: 0, max: 100 },
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
  },
  completedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

interviewSchema.index({ userId: 1, status: 1, completedAt: -1 });

module.exports = mongoose.model("Interview", interviewSchema);
