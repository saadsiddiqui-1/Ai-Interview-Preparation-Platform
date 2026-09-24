const mongoose = require("mongoose");
const Answer = require("../models/Answer");
const Interview = require("../models/Interview");
const Question = require("../models/Question");
const { evaluateAnswer } = require("../services/answerEvaluationService");

const submitAnswer = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    const { questionId, answer } = req.body;

    if (!mongoose.isValidObjectId(interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID." });
    }
    if (!mongoose.isValidObjectId(questionId)) {
      return res.status(400).json({ success: false, message: "Invalid question ID." });
    }

    const normalizedAnswer = typeof answer === "string" ? answer.trim() : "";
    if (normalizedAnswer.length < 2 || normalizedAnswer.length > 5000) {
      return res.status(400).json({
        success: false,
        message: "Answer must contain between 2 and 5000 characters.",
      });
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user.id });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found." });
    }
    if (interview.status === "completed") {
      return res.status(409).json({
        success: false,
        message: "This interview is already completed and cannot be changed.",
      });
    }

    const question = await Question.findOne({ _id: questionId, interviewId });
    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question does not belong to this interview.",
      });
    }

    const savedAnswer = await Answer.findOneAndUpdate(
      { userId: req.user.id, interviewId, questionId },
      {
        $set: {
          answer: normalizedAnswer,
          evaluationStatus: "pending",
          scores: {
            correctness: null,
            confidence: null,
            communication: null,
            technicalAccuracy: null,
            overall: null,
          },
          strengths: [],
          weaknesses: [],
          suggestions: [],
          evaluationSource: null,
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    if (interview.status === "not_started") {
      interview.status = "in_progress";
      await interview.save();
    }

    const evaluation = await evaluateAnswer({ interview, question, answer: normalizedAnswer });
    savedAnswer.evaluationStatus = "completed";
    savedAnswer.scores = evaluation.scores;
    savedAnswer.strengths = evaluation.strengths;
    savedAnswer.weaknesses = evaluation.weaknesses;
    savedAnswer.suggestions = evaluation.suggestions;
    savedAnswer.evaluationSource = evaluation.source;
    await savedAnswer.save();

    return res.status(200).json({
      success: true,
      message: "Answer saved and evaluated successfully.",
      answer: savedAnswer,
    });
  } catch (error) {
    return next(error);
  }
};

const getInterviewAnswers = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    if (!mongoose.isValidObjectId(interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID." });
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user.id });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found." });
    }

    const answers = await Answer.find({ userId: req.user.id, interviewId }).sort({ createdAt: 1 });
    return res.json({ success: true, answers });
  } catch (error) {
    return next(error);
  }
};

const completeInterview = async (req, res, next) => {
  try {
    const { interviewId } = req.params;
    if (!mongoose.isValidObjectId(interviewId)) {
      return res.status(400).json({ success: false, message: "Invalid interview ID." });
    }

    const interview = await Interview.findOne({ _id: interviewId, userId: req.user.id });
    if (!interview) {
      return res.status(404).json({ success: false, message: "Interview not found." });
    }

    const questionIds = await Question.find({ interviewId }).distinct("_id");
    if (!questionIds.length) {
      return res.status(409).json({
        success: false,
        message: "This interview has no questions and cannot be completed.",
      });
    }
    const answers = await Answer.find({
      userId: req.user.id,
      interviewId,
      questionId: { $in: questionIds },
      evaluationStatus: "completed",
    });

    if (answers.length !== questionIds.length) {
      return res.status(409).json({
        success: false,
        message: `Answer and evaluate all questions before finishing. ${answers.length} of ${questionIds.length} completed.`,
        answeredQuestions: answers.length,
        totalQuestions: questionIds.length,
      });
    }

    const average = (field) => Math.round(
      answers.reduce((total, item) => total + item.scores[field], 0) / answers.length
    );
    const uniqueFeedback = (field) => [
      ...new Set(answers.flatMap((item) => item[field]).filter(Boolean)),
    ].slice(0, 5);
    const categoryScores = {
      correctness: average("correctness"),
      confidence: average("confidence"),
      communication: average("communication"),
      technicalAccuracy: average("technicalAccuracy"),
    };
    const overallScore = average("overall");
    const strengths = uniqueFeedback("strengths");
    const weaknesses = uniqueFeedback("weaknesses");
    const suggestions = uniqueFeedback("suggestions");

    interview.status = "completed";
    interview.score = overallScore;
    interview.feedback = suggestions.join(" ");
    interview.performanceReport = {
      answeredQuestions: answers.length,
      categoryScores,
      strengths,
      weaknesses,
      suggestions,
    };
    interview.completedAt = interview.completedAt || new Date();
    await interview.save();

    return res.json({
      success: true,
      message: "Interview completed successfully.",
      interview,
      answers,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { submitAnswer, getInterviewAnswers, completeInterview };
