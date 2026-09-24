import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiFileText, FiUploadCloud } from "react-icons/fi";
import api from "../api/axios";
import "../App.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ["pdf", "docx"];
const TARGET_ROLES = [
  "Software Developer",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile App Developer",
  "Android Developer",
  "iOS Developer",
  "Game Developer",
  "DevOps Engineer",
  "Cloud Engineer",
  "Site Reliability Engineer",
  "Cybersecurity Analyst",
  "Network Engineer",
  "System Administrator",
  "Database Administrator",
  "Data Analyst",
  "Data Scientist",
  "Data Engineer",
  "Machine Learning Engineer",
  "AI Engineer",
  "Business Analyst",
  "Product Manager",
  "Project Manager",
  "UI/UX Designer",
  "Graphic Designer",
  "Quality Assurance Engineer",
  "Automation Test Engineer",
  "Technical Support Engineer",
  "Solutions Architect",
  "Sales Executive",
  "Marketing Executive",
  "Digital Marketing Specialist",
  "Content Writer",
  "Human Resources Executive",
  "Recruiter",
  "Finance Analyst",
  "Accountant",
  "Operations Manager",
  "Customer Support Executive",
  "Teacher",
  "Civil Engineer",
  "Mechanical Engineer",
  "Electrical Engineer",
  "Electronics Engineer",
];

function ResumeUpload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [role, setRole] = useState("Software Developer");
  const [showRoleSuggestions, setShowRoleSuggestions] = useState(false);
  const [experienceLevel, setExperienceLevel] = useState("Fresher");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const normalizedRole = role.trim().toLowerCase();
  const roleSuggestions = normalizedRole
    ? TARGET_ROLES.filter(
        (targetRole) =>
          targetRole.toLowerCase().includes(normalizedRole) &&
          targetRole.toLowerCase() !== normalizedRole
      ).slice(0, 8)
    : TARGET_ROLES.slice(0, 8);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    setError("");

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const extension = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      setFile(null);
      event.target.value = "";
      setError("Please select a PDF or DOCX resume.");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setFile(null);
      event.target.value = "";
      setError("The resume must be 5 MB or smaller.");
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Select a resume before continuing.");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("role", role);
      formData.append("experienceLevel", experienceLevel);
      formData.append("difficulty", difficulty);

      const { data } = await api.post("/resume/upload", formData);
      const dashboardData = {
        resume: data.resume,
        preferences: { role, experienceLevel, difficulty },
      };

      localStorage.setItem("latestResumeAnalysis", JSON.stringify(dashboardData));
      navigate("/dashboard", { state: dashboardData });
    } catch (uploadError) {
      setError(
        uploadError.response?.data?.message ||
          "Could not analyze the resume. Make sure the backend is running."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <main className="page-shell upload-page">
      <section className="upload-card">
        <div className="page-icon" aria-hidden="true">
          <FiUploadCloud />
        </div>
        <p className="eyebrow">Resume analysis</p>
        <h1>Build your interview profile</h1>
        <p className="page-description">
          Upload your resume and we will identify the experience and skills that
          should shape your practice interview.
        </p>

        <label className="file-picker">
          <FiFileText aria-hidden="true" />
          <span>{file ? file.name : "Choose a PDF or DOCX resume"}</span>
          <input type="file" accept=".pdf,.docx" onChange={handleFileChange} />
        </label>
        <p className="file-hint">Maximum file size: 5 MB</p>

        <div className="form-grid">
          <label>
            Target role
            <div className="role-autocomplete">
              <input
                type="text"
                value={role}
                onChange={(event) => {
                  setRole(event.target.value);
                  setShowRoleSuggestions(true);
                }}
                onFocus={() => setShowRoleSuggestions(true)}
                onBlur={() => setShowRoleSuggestions(false)}
                placeholder="Search or type any job role"
                autoComplete="off"
                role="combobox"
                aria-expanded={showRoleSuggestions && roleSuggestions.length > 0}
                aria-controls="target-role-suggestions"
                required
              />
              {showRoleSuggestions && roleSuggestions.length > 0 && (
                <ul id="target-role-suggestions" className="role-suggestions" role="listbox">
                  {roleSuggestions.map((targetRole) => (
                    <li
                      key={targetRole}
                      role="option"
                      aria-selected="false"
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setRole(targetRole);
                        setShowRoleSuggestions(false);
                      }}
                    >
                      {targetRole}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </label>

          <label>
            Experience
            <select
              value={experienceLevel}
              onChange={(event) => setExperienceLevel(event.target.value)}
            >
              <option>Fresher</option>
              <option>1-2 Years</option>
              <option>3-5 Years</option>
              <option>5+ Years</option>
            </select>
          </label>

          <label className="full-width-field">
            Interview difficulty
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>
        </div>

        {error && <p className="status-message error-message">{error}</p>}

        <button className="primary-button" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Analyzing resume..." : "Upload and analyze resume"}
        </button>
      </section>
    </main>
  );
}

export default ResumeUpload;
