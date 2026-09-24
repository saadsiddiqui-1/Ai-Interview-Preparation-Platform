import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiSave } from "react-icons/fi";
import api from "../api/axios";
import "../App.css";

const listToText = (items) => (items || []).join("\n");
const textToList = (text) =>
  [...new Set(text.split("\n").map((item) => item.trim()).filter(Boolean))];

function ResumeEdit() {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadResume = async () => {
      try {
        const { data } = await api.get("/resume/latest");
        if (data.resume._id !== resumeId) {
          setError("This resume is not available for editing.");
          return;
        }

        setForm({
          role: data.resume.interviewPreferences.role,
          experienceLevel: data.resume.interviewPreferences.experienceLevel,
          difficulty: data.resume.interviewPreferences.difficulty,
          skills: listToText(data.resume.analysis.skills),
          education: listToText(data.resume.analysis.education),
          experience: listToText(data.resume.analysis.experience),
          keywords: listToText(data.resume.analysis.keywords),
        });
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Could not load the resume profile.");
      } finally {
        setIsLoading(false);
      }
    };

    loadResume();
  }, [resumeId]);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const { data } = await api.patch(`/resume/${resumeId}`, {
        role: form.role,
        experienceLevel: form.experienceLevel,
        difficulty: form.difficulty,
        skills: textToList(form.skills),
        education: textToList(form.education),
        experience: textToList(form.experience),
        keywords: textToList(form.keywords),
      });

      const dashboardData = {
        resume: data.resume,
        preferences: data.resume.interviewPreferences,
      };
      localStorage.setItem("latestResumeAnalysis", JSON.stringify(dashboardData));
      navigate("/dashboard", { replace: true, state: dashboardData });
    } catch (saveError) {
      setError(saveError.response?.data?.message || "Could not save the resume profile.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <main className="resume-edit-page"><p className="interview-state">Loading resume profile...</p></main>;
  }

  if (!form) {
    return (
      <main className="resume-edit-page">
        <section className="interview-state">
          <h1>Resume unavailable</h1>
          <p>{error}</p>
          <button onClick={() => navigate("/dashboard")}>Return to dashboard</button>
        </section>
      </main>
    );
  }

  return (
    <main className="resume-edit-page">
      <button className="text-button" onClick={() => navigate("/dashboard")}>
        <FiArrowLeft /> Back to dashboard
      </button>

      <section className="resume-edit-card">
        <p className="eyebrow">Resume profile</p>
        <h1>Edit your interview profile</h1>
        <p className="page-description">
          Update the structured information used to create your interview questions.
          Enter one list item per line.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="setup-row">
            <label className="setup-field">
              Target role
              <input name="role" value={form.role} onChange={updateField} maxLength="120" required />
            </label>
            <label className="setup-field">
              Experience level
              <select name="experienceLevel" value={form.experienceLevel} onChange={updateField}>
                <option>Fresher</option>
                <option>1-2 Years</option>
                <option>3-5 Years</option>
                <option>5+ Years</option>
              </select>
            </label>
          </div>

          <label className="setup-field edit-difficulty">
            Default interview difficulty
            <select name="difficulty" value={form.difficulty} onChange={updateField}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>

          <div className="resume-edit-grid">
            <label className="setup-field">
              Skills
              <textarea name="skills" value={form.skills} onChange={updateField} rows="8" />
            </label>
            <label className="setup-field">
              Keywords
              <textarea name="keywords" value={form.keywords} onChange={updateField} rows="8" />
            </label>
            <label className="setup-field">
              Education
              <textarea name="education" value={form.education} onChange={updateField} rows="8" />
            </label>
            <label className="setup-field">
              Experience
              <textarea name="experience" value={form.experience} onChange={updateField} rows="8" />
            </label>
          </div>

          {error && <p className="status-message error-message">{error}</p>}
          <button className="primary-button" type="submit" disabled={isSaving}>
            <FiSave /> {isSaving ? "Saving changes..." : "Save resume profile"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default ResumeEdit;
