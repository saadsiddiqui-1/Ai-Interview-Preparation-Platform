import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  FiAward,
  FiBarChart2,
  FiBookOpen,
  FiBriefcase,
  FiEdit3,
  FiFileText,
  FiTag,
  FiTrash2,
  FiUpload,
} from "react-icons/fi";
import "../App.css";
import api from "../api/axios";

const readSavedAnalysis = (currentUserId) => {
  try {
    const savedValue = localStorage.getItem("latestResumeAnalysis");
    const savedAnalysis = savedValue ? JSON.parse(savedValue) : null;
    return savedAnalysis?.resume?.userId === currentUserId ? savedAnalysis : null;
  } catch {
    return null;
  }
};

const AnalysisList = ({ items, emptyMessage }) => {
  if (!items?.length) return <p className="empty-result">{emptyMessage}</p>;

  return (
    <ul className="analysis-list">
      {items.map((item, index) => (
        <li key={`${item}-${index}`}>{item}</li>
      ))}
    </ul>
  );
};

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  const routeData = location.state;
  const initialData =
    routeData?.resume?.userId === currentUser?.id
      ? routeData
      : readSavedAnalysis(currentUser?.id);
  const [dashboardData, setDashboardData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [deleteMessage, setDeleteMessage] = useState("");

  const handleDeleteAccount = async () => {
    if (!window.confirm("Delete your account and all resumes, interviews, answers, and analytics permanently? This cannot be undone.")) return;
    const password = window.prompt("Enter your account password to confirm deletion:");
    if (!password) return;
    try {
      await api.delete("/auth/account", { data: { password } });
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("latestResumeAnalysis");
      navigate("/", { state: { message: "Your account has been deleted." } });
    } catch (error) {
      setDeleteMessage(error.response?.data?.message || "Could not delete your account. Please try again.");
    }
  };
  const handleLogout = () => {
    localStorage.removeItem("authToken"); localStorage.removeItem("currentUser"); localStorage.removeItem("latestResumeAnalysis");
    navigate("/", { replace: true, state: { message: "You have been logged out." } });
  };

  useEffect(() => {
    if (currentUser?.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }
    if (dashboardData) return;

    const loadLatestResume = async () => {
      try {
        const { data } = await api.get("/resume/latest");
        const savedData = {
          resume: data.resume,
          preferences: data.resume.interviewPreferences,
        };
        localStorage.setItem("latestResumeAnalysis", JSON.stringify(savedData));
        setDashboardData(savedData);
      } catch (loadError) {
        if (loadError.response?.status !== 404) {
          console.error("Could not load the latest resume analysis.", loadError);
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadLatestResume();
  }, [dashboardData, currentUser?.role, navigate]);

  const resume = dashboardData?.resume;
  const analysis = resume?.analysis;
  const preferences = dashboardData?.preferences;

  if (isLoading) {
    return (
      <main className="page-shell empty-dashboard">
        <section className="empty-dashboard-card">
          <FiFileText aria-hidden="true" />
          <h1>Loading your dashboard</h1>
          <p>Retrieving your latest resume analysis...</p>
        </section>
      </main>
    );
  }

  if (!analysis) {
    return (
      <main className="page-shell empty-dashboard">
        <section className="empty-dashboard-card">
          <FiFileText aria-hidden="true" />
          <h1>Your interview dashboard</h1>
          <p>Upload a resume to create your interview profile and view its analysis.</p>
          <button className="primary-button" onClick={() => navigate("/resume-upload")}>
            <FiUpload aria-hidden="true" /> Upload resume
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Interview dashboard</p>
          <h1>Your resume analysis</h1>
          <p>{resume.fileName}</p>
        </div>
        <div className="dashboard-actions">
          <button className="secondary-button" onClick={() => navigate("/analytics")}>
            <FiBarChart2 aria-hidden="true" /> Performance analytics
          </button>
          {currentUser?.role === "admin" && <button className="secondary-button" onClick={() => navigate("/admin")}>Admin overview</button>}
          <button className="secondary-button" onClick={handleLogout}>Log out</button>
          <button className="secondary-button" onClick={() => navigate(`/resume/${resume._id}/edit`)}>
            <FiEdit3 aria-hidden="true" /> Edit resume profile
          </button>
          <button className="secondary-button" onClick={() => navigate("/resume-upload")}>
            <FiUpload aria-hidden="true" /> Analyze another resume
          </button>
          <button className="danger-button" onClick={handleDeleteAccount}>
            <FiTrash2 aria-hidden="true" /> Delete account
          </button>
        </div>
      </header>
      {deleteMessage && <p className="form-error account-delete-message">{deleteMessage}</p>}

      <section className="profile-summary">
        <div>
          <span>Target role</span>
          <strong>{preferences?.role || "Not selected"}</strong>
        </div>
        <div>
          <span>Experience</span>
          <strong>{preferences?.experienceLevel || "Not selected"}</strong>
        </div>
        <div>
          <span>Difficulty</span>
          <strong>{preferences?.difficulty || "Not selected"}</strong>
        </div>
        <div>
          <span>Skills identified</span>
          <strong>{analysis.skills.length}</strong>
        </div>
      </section>

      <section className="analysis-grid">
        <article className="analysis-card skills-card">
          <div className="card-heading">
            <FiAward aria-hidden="true" />
            <h2>Skills</h2>
          </div>
          {analysis.skills.length ? (
            <div className="tag-list">
              {analysis.skills.map((skill) => <span key={skill}>{skill}</span>)}
            </div>
          ) : (
            <p className="empty-result">No recognized skills found.</p>
          )}
        </article>

        <article className="analysis-card">
          <div className="card-heading">
            <FiBookOpen aria-hidden="true" />
            <h2>Education</h2>
          </div>
          <AnalysisList items={analysis.education} emptyMessage="No education section found." />
        </article>

        <article className="analysis-card">
          <div className="card-heading">
            <FiBriefcase aria-hidden="true" />
            <h2>Experience</h2>
          </div>
          <AnalysisList items={analysis.experience} emptyMessage="No experience section found." />
        </article>

        <article className="analysis-card">
          <div className="card-heading">
            <FiTag aria-hidden="true" />
            <h2>Keywords</h2>
          </div>
          <div className="tag-list keyword-list">
            {analysis.keywords.map((keyword) => <span key={keyword}>{keyword}</span>)}
          </div>
        </article>
      </section>

      <section className="next-step-card">
        <div>
          <p className="eyebrow">AI mock interview</p>
          <h2>Generate a personalized mock interview</h2>
          <p>Your resume profile is ready to generate role-specific AI questions.</p>
        </div>
        <button onClick={() => navigate("/interview/setup")}>Generate questions</button>
      </section>
    </main>
  );
}

export default Dashboard;
