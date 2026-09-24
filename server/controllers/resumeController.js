const path = require("path");
const mongoose = require("mongoose");
const Resume = require("../models/Resume");
const { parseResume } = require("../services/resumeParserService");

const cleanStringArray = (value, maximumItems) => {
  if (!Array.isArray(value)) return null;
  return [...new Set(
    value
      .map((item) => String(item).trim())
      .filter(Boolean)
      .map((item) => item.slice(0, 300))
  )].slice(0, maximumItems);
};

const uploadAndAnalyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Please upload a PDF or DOCX resume." });
    }

    const analysis = await parseResume(req.file.path, req.file.mimetype);
    const resume = await Resume.create({
      userId: req.user?.id || null,
      fileName: req.file.originalname,
      storedFileName: req.file.filename,
      filePath: path.relative(path.join(__dirname, ".."), req.file.path),
      mimeType: req.file.mimetype,
      interviewPreferences: {
        role: req.body.role || "Not selected",
        experienceLevel: req.body.experienceLevel || "Not selected",
        difficulty: req.body.difficulty || "Not selected",
      },
      analysis,
    });

    return res.status(201).json({
      success: true,
      message: "Resume uploaded and analyzed successfully.",
      resume,
    });
  } catch (error) {
    return next(error);
  }
};

const getLatestResume = async (req, res, next) => {
  try {
    const resume = await Resume.findOne({ userId: req.user.id }).sort({ uploadedAt: -1 });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "No resume analysis found. Please upload your resume.",
      });
    }

    return res.json({ success: true, resume });
  } catch (error) {
    return next(error);
  }
};

const updateResumeProfile = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.resumeId)) {
      return res.status(400).json({ success: false, message: "Invalid resume ID." });
    }

    const resume = await Resume.findOne({
      _id: req.params.resumeId,
      userId: req.user.id,
    });

    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found." });
    }

    const { role, experienceLevel, difficulty, skills, education, experience, keywords } = req.body;
    const cleanedSkills = cleanStringArray(skills, 40);
    const cleanedEducation = cleanStringArray(education, 20);
    const cleanedExperience = cleanStringArray(experience, 30);
    const cleanedKeywords = cleanStringArray(keywords, 40);

    if (!role?.trim()) {
      return res.status(400).json({ success: false, message: "Target role is required." });
    }
    if (![cleanedSkills, cleanedEducation, cleanedExperience, cleanedKeywords].every(Boolean)) {
      return res.status(400).json({ success: false, message: "Resume analysis fields must be lists." });
    }
    if (!["Fresher", "1-2 Years", "3-5 Years", "5+ Years"].includes(experienceLevel)) {
      return res.status(400).json({ success: false, message: "Select a valid experience level." });
    }
    if (!["Beginner", "Intermediate", "Advanced"].includes(difficulty)) {
      return res.status(400).json({ success: false, message: "Select a valid difficulty." });
    }

    resume.interviewPreferences = {
      role: role.trim().slice(0, 120),
      experienceLevel,
      difficulty,
    };
    resume.analysis.skills = cleanedSkills;
    resume.analysis.education = cleanedEducation;
    resume.analysis.experience = cleanedExperience;
    resume.analysis.keywords = cleanedKeywords;
    await resume.save();

    return res.json({
      success: true,
      message: "Resume profile updated successfully.",
      resume,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getLatestResume, updateResumeProfile, uploadAndAnalyzeResume };
