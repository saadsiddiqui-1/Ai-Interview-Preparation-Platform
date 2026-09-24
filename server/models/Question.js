const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  interviewId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Interview",
    required: true,
    index: true,
  },
  order: { type: Number, required: true, min: 1 },
  question: { type: String, required: true, trim: true },
  type: {
    type: String,
    required: true,
    enum: ["HR", "Technical", "Behavioral"],
  },
  difficulty: {
    type: String,
    required: true,
    enum: ["Beginner", "Intermediate", "Advanced"],
  },
  skill: { type: String, default: null },
  expectedPoints: { type: [String], default: [] },
});

questionSchema.index({ interviewId: 1, order: 1 }, { unique: true });

module.exports = mongoose.model("Question", questionSchema);
