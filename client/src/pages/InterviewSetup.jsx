import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiCpu, FiMessageSquare, FiUsers } from "react-icons/fi";
import api from "../api/axios";
import "../App.css";

const readLatestResume = () => {
  try {
    const value = localStorage.getItem("latestResumeAnalysis");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const INTERVIEW_TYPES = [
  { value: "HR", label: "HR", description: "Motivation, goals, and workplace fit", icon: FiUsers },
  { value: "Technical", label: "Technical", description: "Role-specific knowledge and skill questions", icon: FiCpu },
  { value: "Behavioral", label: "Behavioral", description: "Situation-based experience questions", icon: FiMessageSquare },
  { value: "Mixed", label: "Mixed", description: "A balanced complete interview", icon: FiMessageSquare },
];

function InterviewSetup() {
  const navigate = useNavigate();
  const savedData = readLatestResume();
  const [role, setRole] = useState(savedData?.preferences?.role || "");
  const [type, setType] = useState("Mixed");
  const [difficulty, setDifficulty] = useState(
    ["Beginner", "Intermediate", "Advanced"].includes(savedData?.preferences?.difficulty)
      ? savedData.preferences.difficulty
      : "Intermediate"
  );
  const [questionCount, setQuestionCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (!role.trim()) {
      setError("Enter the job role for this interview.");
      return;
    }

    setIsGenerating(true);
    setError("");

    try {
      const { data } = await api.post("/interviews/generate", {
        resumeId: savedData?.resume?._id,
        role: role.trim(),
        type,
        difficulty,
        questionCount: Number(questionCount),
      });

      const interviewData = { interview: data.interview, questions: data.questions };
      localStorage.setItem("activeInterview", JSON.stringify(interviewData));
      navigate(`/interview/${data.interview._id}`, { state: interviewData });
    } catch (generationError) {
      setError(
        generationError.response?.data?.message ||
          "Could not generate questions. Make sure the backend is running."
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="interview-setup-page">
      <button className="text-button" onClick={() => navigate("/dashboard")}>
        <FiArrowLeft /> Back to dashboard
      </button>

      <section className="setup-card">
        <p className="eyebrow">Mock interview setup</p>
        <h1>Configure your mock interview</h1>
        <p className="page-description">
          Questions will be personalized using your target role, resume skills,
          experience, and selected difficulty.
        </p>

        <form onSubmit={handleGenerate}>
          <label className="setup-field">
            Target role
            <input
              type="text"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="Enter any job role"
              maxLength="120"
              required
            />
          </label>

          <fieldset className="interview-type-fieldset">
            <legend>Interview type</legend>
            <div className="interview-type-grid">
              {INTERVIEW_TYPES.map(({ value, label, description, icon: Icon }) => (
                <label
                  className={`interview-type-option ${type === value ? "selected" : ""}`}
                  key={value}
                >
                  <input
                    type="radio"
                    name="interviewType"
                    value={value}
                    checked={type === value}
                    onChange={(event) => setType(event.target.value)}
                  />
                  <Icon aria-hidden="true" />
                  <strong>{label}</strong>
                  <span>{description}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="setup-row">
            <label className="setup-field">
              Difficulty
              <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Advanced</option>
              </select>
            </label>

            <label className="setup-field">
              Number of questions
              <select
                value={questionCount}
                onChange={(event) => setQuestionCount(Number(event.target.value))}
              >
                <option value="5">5 questions</option>
                <option value="10">10 questions</option>
                <option value="15">15 questions</option>
              </select>
            </label>
          </div>

          {error && <p className="status-message error-message">{error}</p>}

          <button className="primary-button" type="submit" disabled={isGenerating}>
            {isGenerating ? "Generating personalized questions..." : "Generate interview questions"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default InterviewSetup;
