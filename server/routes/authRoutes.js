const express = require("express");
const { deleteAccount, forgotPassword, login, register, resetPassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.delete("/account", protect, deleteAccount);

module.exports = router;
