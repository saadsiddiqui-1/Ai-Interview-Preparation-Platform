const express = require("express");
const {
  getLatestResume,
  updateResumeProfile,
  uploadAndAnalyzeResume,
} = require("../controllers/resumeController");
const { protect } = require("../middleware/authMiddleware");
const { uploadResume } = require("../middleware/uploadMiddleware");

const router = express.Router();

router.get("/latest", protect, getLatestResume);
router.patch("/:resumeId", protect, updateResumeProfile);
router.post("/upload", protect, uploadResume.single("resume"), uploadAndAnalyzeResume);

module.exports = router;
