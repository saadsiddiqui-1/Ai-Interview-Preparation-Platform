const mongoose = require("mongoose");
const Interview = require("../models/Interview");
const Question = require("../models/Question");
const Resume = require("../models/Resume");
const { generateQuestions } = require("../services/questionGenerationService");
const ImprovementPlan = require("../models/ImprovementPlan");

const ALLOWED_TYPES = ["HR", "Technical", "Behavioral", "Mixed"];
const ALLOWED_DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];
const escapeRegularExpression = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const generateInterview = async (req, res, next) => {
  let interview;

  try {
    const { resumeId, type = "Mixed", difficulty = "Intermediate" } = req.body;
    const count = Number(req.body.questionCount || 10);

    if (!ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Select a valid interview type." });
    }
    if (!ALLOWED_DIFFICULTIES.includes(difficulty)) {
      return res.status(400).json({ success: false, message: "Select a valid difficulty." });
    }
    if (!Number.isInteger(count) || count < 5 || count > 15) {
      return res.status(400).json({ success: false, message: "Question count must be between 5 and 15." });
    }
    if (resumeId && !mongoose.isValidObjectId(resumeId)) {
      return res.status(400).json({ success: false, message: "Invalid resume ID." });
    }

    const resumeQuery = { userId: req.user.id };
    if (resumeId) resumeQuery._id = resumeId;
    const resume = await Resume.findOne(resumeQuery).sort({ uploadedAt: -1 });

    if (!resume) {
      return res.status(404).json({ success: false, message: "Upload a resume before generating an interview." });
    }

    const role = (req.body.role || resume.interviewPreferences.role || "").trim();
    if (!role || role === "Not selected") {
      return res.status(400).json({ success: false, message: "Select or enter a target role." });
    }

    const generationResult = await generateQuestions({ role, type, difficulty, count, resume });
    const generatedQuestions = generationResult.questions;
    if (generatedQuestions.length !== count) {
      throw new Error("The question generator could not create the requested number of unique questions.");
    }

    interview = await Interview.create({
      userId: req.user.id,
      resumeId: resume._id,
      role,
      type,
      difficulty,
      questionCount: count,
      generationSource: generationResult.source,
      generationModel: generationResult.model,
    });

    const questions = await Question.insertMany(
      generatedQuestions.map((question) => ({ ...question, interviewId: interview._id }))
    );

    return res.status(201).json({
      success: true,
      message: "Interview questions generated successfully.",
      interview,
      questions,
    });
  } catch (error) {
    if (interview?._id) await Interview.findByIdAndDelete(interview._id).catch(() => {});
    return next(error);
  }
};

const getInterview = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID." });
    }

    const interview = await Interview.findOne({
      _id: req.params.interviewId,
      userId: req.user.id,
    });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found." });
    }

    const questions = await Question.find({ interviewId: interview._id }).sort({ order: 1 });
    return res.json({ success: true, interview, questions });
  } catch (error) {
    return next(error);
  }
};

const getInterviewHistory = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const query = { userId: req.user.id, status: "completed" };

    if (req.query.type) {
      if (!ALLOWED_TYPES.includes(req.query.type)) {
        return res.status(400).json({ success: false, message: "Select a valid interview type." });
      }
      query.type = req.query.type;
    }
    if (req.query.difficulty) {
      if (!ALLOWED_DIFFICULTIES.includes(req.query.difficulty)) {
        return res.status(400).json({ success: false, message: "Select a valid difficulty." });
      }
      query.difficulty = req.query.difficulty;
    }
    if (req.query.role?.trim()) {
      query.role = {
        $regex: escapeRegularExpression(req.query.role.trim().slice(0, 120)),
        $options: "i",
      };
    }

    const [interviews, total] = await Promise.all([
      Interview.find(query)
        .select("role type difficulty questionCount generationSource status score performanceReport completedAt createdAt")
        .sort({ completedAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Interview.countDocuments(query),
    ]);

    return res.json({
      success: true,
      interviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return next(error);
  }
};

const getInterviewAnalytics = async (req, res, next) => {
  try {
    const interviews = await Interview.find({
      userId: req.user.id,
      status: "completed",
      score: { $ne: null },
    })
      .select("role type difficulty score performanceReport completedAt createdAt")
      .sort({ completedAt: 1, createdAt: 1 })
      .lean();

    const emptyCategoryAverages = {
      correctness: null,
      confidence: null,
      communication: null,
      technicalAccuracy: null,
    };
    if (!interviews.length) {
      return res.json({
        success: true,
        summary: {
          totalInterviews: 0,
          averageScore: null,
          highestScore: null,
          latestScore: null,
          scoreImprovement: null,
          strongestCategory: null,
          weakestCategory: null,
        },
        categoryAverages: emptyCategoryAverages,
        scoreTrend: [],
        improvementSuggestions: [],
      });
    }

    const roundAverage = (values) => {
      const validValues = values.filter(Number.isFinite);
      return validValues.length
        ? Math.round(validValues.reduce((total, value) => total + value, 0) / validValues.length)
        : null;
    };
    const categoryNames = ["correctness", "confidence", "communication", "technicalAccuracy"];
    const categoryAverages = Object.fromEntries(
      categoryNames.map((category) => [
        category,
        roundAverage(interviews.map((item) => item.performanceReport?.categoryScores?.[category])),
      ])
    );
    const rankedCategories = Object.entries(categoryAverages)
      .filter(([, score]) => Number.isFinite(score))
      .sort((first, second) => second[1] - first[1]);
    const categoryLabels = {
      correctness: "Correctness",
      confidence: "Confidence",
      communication: "Communication",
      technicalAccuracy: "Technical accuracy",
    };

    const suggestionCounts = new Map();
    interviews.forEach((interview) => {
      (interview.performanceReport?.suggestions || []).forEach((suggestion) => {
        const normalized = suggestion.trim().toLowerCase();
        if (!normalized) return;
        const existing = suggestionCounts.get(normalized);
        suggestionCounts.set(normalized, {
          suggestion: existing?.suggestion || suggestion.trim(),
          count: (existing?.count || 0) + 1,
        });
      });
    });

    const scores = interviews.map((item) => item.score).filter(Number.isFinite);
    const firstScore = scores[0];
    const latestScore = scores[scores.length - 1];

    return res.json({
      success: true,
      summary: {
        totalInterviews: interviews.length,
        averageScore: roundAverage(scores),
        highestScore: Math.max(...scores),
        latestScore,
        scoreImprovement: interviews.length > 1 ? latestScore - firstScore : 0,
        strongestCategory: rankedCategories.length
          ? { name: categoryLabels[rankedCategories[0][0]], score: rankedCategories[0][1] }
          : null,
        weakestCategory: rankedCategories.length
          ? {
              name: categoryLabels[rankedCategories[rankedCategories.length - 1][0]],
              score: rankedCategories[rankedCategories.length - 1][1],
            }
          : null,
      },
      categoryAverages,
      scoreTrend: interviews.map((interview, index) => ({
        interviewId: interview._id,
        sequence: index + 1,
        role: interview.role,
        type: interview.type,
        difficulty: interview.difficulty,
        score: interview.score,
        completedAt: interview.completedAt || interview.createdAt,
      })),
      improvementSuggestions: [...suggestionCounts.values()]
        .sort((first, second) => second.count - first.count)
        .slice(0, 5),
    });
  } catch (error) {
    return next(error);
  }
};

const generateImprovementPlan = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ userId: req.user.id, status: "completed", score: { $ne: null } })
      .sort({ completedAt: -1, createdAt: -1 })
      .lean();
    if (!interview) return res.status(404).json({ success: false, message: "Complete an interview before creating an improvement plan." });

    const categoryScores = interview.performanceReport?.categoryScores || {};
    const labels = { correctness: "Correctness", confidence: "Confidence", communication: "Communication", technicalAccuracy: "Technical accuracy" };
    const learning = {
      correctness: { explanation: "Improve the accuracy and completeness of your answers by revising fundamentals and checking assumptions.", keyConcepts: ["Define the concept", "Explain why it works", "Give a practical example"], example: "For a technical answer, state the approach, explain its time or business impact, and mention an edge case.", practiceQuestions: ["Explain a core concept from your target role.", "Describe an edge case and how you would handle it."] },
      confidence: { explanation: "Build confidence by preparing a clear structure and practicing concise answers aloud.", keyConcepts: ["Pause before answering", "Use a clear structure", "End with a result"], example: "Use Situation, Action, Result (STAR) to answer behavioral questions without losing focus.", practiceQuestions: ["Tell me about a challenge you overcame.", "Describe a time you received difficult feedback."] },
      communication: { explanation: "Make answers easier to understand by using simple language, logical order, and relevant detail.", keyConcepts: ["Lead with the main point", "Avoid unnecessary jargon", "Confirm the interviewer understood"], example: "Start with a one-sentence answer, then add two supporting details and a result.", practiceQuestions: ["Explain a complex topic to a non-technical person.", "Give a two-minute summary of your strongest project."] },
      technicalAccuracy: { explanation: "Strengthen role-specific technical knowledge and explain trade-offs accurately.", keyConcepts: ["Review role fundamentals", "Compare alternatives", "Mention trade-offs"], example: "When choosing a database, explain data shape, query needs, consistency, and scale before naming a technology.", practiceQuestions: [`Answer a technical ${interview.role} question using a real project example.`, "Compare two tools or approaches used in your role."] },
    };
    const fallback = [
      { area: "Technical accuracy", recommendation: "Review the core concepts used in your target role and explain them with examples.", practiceTopic: `${interview.role} technical fundamentals`, ...learning.technicalAccuracy },
      { area: "Communication", recommendation: "Structure answers with a clear situation, action, and result, then practice speaking concisely.", practiceTopic: "Structured interview communication", ...learning.communication },
    ];
    const weakest = Object.entries(categoryScores)
      .filter(([, score]) => Number.isFinite(score))
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([category, score]) => ({
        area: labels[category],
        recommendation: score < 60 ? `Focus on improving ${labels[category].toLowerCase()} through targeted practice and review.` : `Continue strengthening ${labels[category].toLowerCase()} with timed mock answers.`,
        practiceTopic: `${interview.role} ${labels[category]} practice`,
        ...learning[category],
      }));
    const recommendations = weakest.length ? weakest : fallback;
    const plan = await ImprovementPlan.findOneAndUpdate(
      { userId: req.user.id },
      { userId: req.user.id, sourceInterviewId: interview._id, recommendations },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return res.json({ success: true, message: "Personalized improvement plan created.", plan });
  } catch (error) {
    return next(error);
  }
};

const getImprovementPlan = async (req, res, next) => {
  try {
    const plan = await ImprovementPlan.findOne({ userId: req.user.id }).lean();
    return res.json({ success: true, plan });
  } catch (error) {
    return next(error);
  }
};

const updateImprovementRecommendation = async (req, res, next) => {
  try {
    const allowed = ["pending", "in_progress", "completed"];
    if (!allowed.includes(req.body.status)) return res.status(400).json({ success: false, message: "Select a valid recommendation status." });
    const plan = await ImprovementPlan.findOne({ userId: req.user.id });
    const recommendation = plan?.recommendations.id(req.params.recommendationId);
    if (!recommendation) return res.status(404).json({ success: false, message: "Recommendation not found." });
    recommendation.status = req.body.status;
    await plan.save();
    return res.json({ success: true, recommendation });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  generateInterview,
  getInterview,
  getInterviewAnalytics,
  getInterviewHistory,
  generateImprovementPlan,
  getImprovementPlan,
  updateImprovementRecommendation,
};
