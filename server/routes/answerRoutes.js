const express = require("express");
const {
  completeInterview,
  getInterviewAnswers,
  submitAnswer,
} = require("../controllers/answerController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);
router.post("/:interviewId/complete", completeInterview);
router.get("/:interviewId", getInterviewAnswers);
router.post("/:interviewId", submitAnswer);

module.exports = router;
