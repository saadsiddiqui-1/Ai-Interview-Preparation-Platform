const User = require("../models/User");
const Resume = require("../models/Resume");
const Interview = require("../models/Interview");
const Answer = require("../models/Answer");

const getAdminOverview = async (req, res, next) => {
  try {
    const [users, resumes, interviews, completedInterviews, answers, topRoles] = await Promise.all([
      User.countDocuments(), Resume.countDocuments(), Interview.countDocuments(),
      Interview.countDocuments({ status: "completed" }), Answer.countDocuments(),
      Interview.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
    ]);
    return res.json({ success: true, overview: { users, resumes, interviews, completedInterviews, answers, topRoles: topRoles.map((item) => ({ role: item._id, count: item.count })) } });
  } catch (error) { return next(error); }
};

const getAdminUsers = async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 10, 1), 50);
    const search = req.query.search?.trim();
    const query = search ? { $or: [{ name: { $regex: search.slice(0, 80), $options: "i" } }, { email: { $regex: search.slice(0, 120), $options: "i" } }] } : {};
    const [users, total] = await Promise.all([
      User.find(query).select("name email role createdAt").sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      User.countDocuments(query),
    ]);
    const ids = users.map((user) => user._id);
    const [resumeCounts, interviewCounts, completedCounts] = await Promise.all([
      Resume.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
      Interview.aggregate([{ $match: { userId: { $in: ids } } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
      Interview.aggregate([{ $match: { userId: { $in: ids }, status: "completed" } }, { $group: { _id: "$userId", count: { $sum: 1 } } }]),
    ]);
    const toMap = (items) => new Map(items.map((item) => [item._id.toString(), item.count]));
    const resumes = toMap(resumeCounts); const interviews = toMap(interviewCounts); const completed = toMap(completedCounts);
    return res.json({ success: true, users: users.map((user) => ({ ...user, resumeCount: resumes.get(user._id.toString()) || 0, interviewCount: interviews.get(user._id.toString()) || 0, completedInterviewCount: completed.get(user._id.toString()) || 0 })), pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { return next(error); }
};

module.exports = { getAdminOverview, getAdminUsers };
