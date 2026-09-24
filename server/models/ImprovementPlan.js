const mongoose = require("mongoose");

const recommendationSchema = new mongoose.Schema(
  {
    area: { type: String, required: true, trim: true },
    recommendation: { type: String, required: true, trim: true },
    practiceTopic: { type: String, required: true, trim: true },
    explanation: { type: String, required: true, trim: true },
    keyConcepts: { type: [String], default: [] },
    example: { type: String, required: true, trim: true },
    practiceQuestions: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
  },
  { _id: true }
);

const improvementPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    sourceInterviewId: { type: mongoose.Schema.Types.ObjectId, ref: "Interview", default: null },
    recommendations: { type: [recommendationSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ImprovementPlan", improvementPlanSchema);
