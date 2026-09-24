const express = require("express");
const { getAdminOverview, getAdminUsers } = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/adminMiddleware");

const router = express.Router();
router.get("/overview", protect, requireAdmin, getAdminOverview);
router.get("/users", protect, requireAdmin, getAdminUsers);
module.exports = router;
