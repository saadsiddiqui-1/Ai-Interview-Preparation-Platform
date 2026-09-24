const express = require("express");
const {
  generateInterview,
  getInterview,
  getInterviewAnalytics,
  getInterviewHistory,
  generateImprovementPlan,
  getImprovementPlan,
  updateImprovementRecommendation,
} = require("../controllers/interviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/generate", protect, generateInterview);
router.get("/history", protect, getInterviewHistory);
router.get("/analytics", protect, getInterviewAnalytics);
router.get("/improvement-plan", protect, getImprovementPlan);
router.post("/improvement-plan/generate", protect, generateImprovementPlan);
router.patch("/improvement-plan/:recommendationId", protect, updateImprovementRecommendation);
router.get("/:interviewId", protect, getInterview);

module.exports = router;
