const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const connectDB = require("./config/db");
const { isEmailConfigured } = require("./services/emailService");

connectDB();

const app = express();
const answerRoutes = require("./routes/answerRoutes");
const authRoutes = require("./routes/authRoutes");
const interviewRoutes = require("./routes/interviewRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const adminRoutes = require("./routes/adminRoutes");

app.use(cors());
app.use(express.json());
app.use("/api/answers", answerRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
    res.send("🚀 AI Interview Preparation Platform API is Running...");
});

app.use((error, req, res, next) => {
  console.error(error);

  if (error.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "Resume file must be 5 MB or smaller.",
    });
  }

  const statusCode = error.message?.includes("allowed") ? 400 : 500;
  return res.status(statusCode).json({
    success: false,
    message: error.message || "An unexpected server error occurred.",
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`✅ Server is running on port ${PORT}`);
    if (isEmailConfigured()) {
      console.log("✅ Email notifications are configured");
    } else {
      console.warn("⚠️ Email notifications are disabled. Add EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM to server/.env");
    }
});
