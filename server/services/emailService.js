const nodemailer = require("nodemailer");

const isEmailConfigured = () => Boolean(
  process.env.EMAIL_HOST &&
  process.env.EMAIL_PORT &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASS &&
  process.env.EMAIL_FROM
);

const getTransporter = () => nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, text, html }) => {
  if (!isEmailConfigured()) {
    console.warn("Email is not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM.");
    return { sent: false, reason: "not_configured" };
  }

  const result = await getTransporter().sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,
  });
  return { sent: true, messageId: result.messageId };
};

const sendWelcomeEmail = ({ name, email }) => sendEmail({
  to: email,
  subject: "Welcome to AI Interview Preparation Platform",
  text: `Hello ${name},\n\nWelcome to AI Interview Preparation Platform. Your account is ready. Log in to upload your resume and start your mock interview preparation.\n\nRegards,\nAI Interview Preparation Platform`,
  html: `<p>Hello ${name},</p><p>Welcome to <strong>AI Interview Preparation Platform</strong>. Your account is ready.</p><p>Log in to upload your resume and start your mock interview preparation.</p><p>Regards,<br />AI Interview Preparation Platform</p>`,
});

const sendPasswordResetEmail = ({ name, email, resetUrl }) => sendEmail({
  to: email,
  subject: "Reset your AI Interview Preparation Platform password",
  text: `Hello ${name},\n\nWe received a request to reset your password. Open this link within 15 minutes:\n${resetUrl}\n\nIf you did not request this, you can ignore this email.\n\nAI Interview Preparation Platform`,
  html: `<p>Hello ${name},</p><p>We received a request to reset your password.</p><p><a href="${resetUrl}">Reset my password</a></p><p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p><p>AI Interview Preparation Platform</p>`,
});

module.exports = { isEmailConfigured, sendPasswordResetEmail, sendWelcomeEmail };
