const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    interviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Interview",
      required: true,
      index: true,
    },
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: "Question", required: true },
    answer: { type: String, required: true, trim: true, minlength: 2, maxlength: 5000 },
    evaluationStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    scores: {
      correctness: { type: Number, default: null, min: 0, max: 100 },
      confidence: { type: Number, default: null, min: 0, max: 100 },
      communication: { type: Number, default: null, min: 0, max: 100 },
      technicalAccuracy: { type: Number, default: null, min: 0, max: 100 },
      overall: { type: Number, default: null, min: 0, max: 100 },
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    suggestions: { type: [String], default: [] },
    evaluationSource: { type: String, enum: ["gemini", "local", null], default: null },
  },
  { timestamps: true }
);

answerSchema.index({ userId: 1, interviewId: 1, questionId: 1 }, { unique: true });

module.exports = mongoose.model("Answer", answerSchema);
