import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ResumeUpload from "./pages/ResumeUpload";
import ProtectedRoute from "./components/ProtectedRoute";
import InterviewSetup from "./pages/InterviewSetup";
import MockInterview from "./pages/MockInterview";
import ResumeEdit from "./pages/ResumeEdit";
import InterviewReport from "./pages/InterviewReport";
import AnalyticsDashboard from "./pages/AnalyticsDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminDashboard from "./pages/AdminDashboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        <Route path="/resume-upload" element={<ProtectedRoute><ResumeUpload /></ProtectedRoute>} />
        <Route path="/resume/:resumeId/edit" element={<ProtectedRoute><ResumeEdit /></ProtectedRoute>} />
        <Route path="/interview/setup" element={<ProtectedRoute><InterviewSetup /></ProtectedRoute>} />
        <Route path="/interview/:interviewId" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
        <Route path="/interview/:interviewId/report" element={<ProtectedRoute><InterviewReport /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
