import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiTarget } from "react-icons/fi";
import api from "../api/axios";
import InterviewHistory from "../components/InterviewHistory";
import PerformanceChart from "../components/PerformanceChart";
import ProgressSummary from "../components/ProgressSummary";
import "../App.css";

const initialFilters = { role: "", type: "", difficulty: "", page: 1 };
const learningFallbacks = {
  Correctness: { explanation: "Improve answer accuracy by revising fundamentals and checking assumptions.", keyConcepts: ["Define the concept", "Explain why it works", "Give an example"], example: "State your approach, explain its impact, and mention an edge case.", practiceQuestions: ["Explain a core concept from your target role.", "Describe an edge case and how you would handle it."] },
  Confidence: { explanation: "Build confidence by preparing a clear structure and practicing answers aloud.", keyConcepts: ["Pause before answering", "Use a clear structure", "End with a result"], example: "Use Situation, Action, Result (STAR) for behavioral answers.", practiceQuestions: ["Tell me about a challenge you overcame.", "Describe a time you received difficult feedback."] },
  Communication: { explanation: "Make answers easier to understand with simple language and logical order.", keyConcepts: ["Lead with the main point", "Avoid unnecessary jargon", "Give relevant detail"], example: "Start with a one-sentence answer, then add supporting details and a result.", practiceQuestions: ["Explain a complex topic to a non-technical person.", "Summarize your strongest project in two minutes."] },
  "Technical accuracy": { explanation: "Strengthen role-specific technical knowledge and explain trade-offs accurately.", keyConcepts: ["Review fundamentals", "Compare alternatives", "Mention trade-offs"], example: "Explain data needs, scale, consistency, and trade-offs before naming a technology.", practiceQuestions: ["Answer a technical question using a real project example.", "Compare two tools used in your role."] },
};

function AnalyticsDashboard() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [history, setHistory] = useState({ interviews: [], pagination: {} });
  const [filters, setFilters] = useState(initialFilters);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState(null);
  const [isPlanLoading, setIsPlanLoading] = useState(true);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const handleLogout = () => {
    localStorage.removeItem("authToken"); localStorage.removeItem("currentUser"); localStorage.removeItem("latestResumeAnalysis");
    navigate("/", { replace: true, state: { message: "You have been logged out." } });
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const { data } = await api.get("/interviews/analytics");
        setAnalytics(data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Could not load performance analytics.");
      } finally {
        setIsLoadingAnalytics(false);
      }
    };
    loadAnalytics();
  }, []);

  useEffect(() => {
    const loadPlan = async () => {
      try {
        const { data } = await api.get("/interviews/improvement-plan");
        setPlan(data.plan);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Could not load your improvement plan.");
      } finally {
        setIsPlanLoading(false);
      }
    };
    loadPlan();
  }, []);

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    setError("");
    try {
      const { data } = await api.post("/interviews/improvement-plan/generate");
      setPlan(data.plan);
    } catch (generateError) {
      setError(generateError.response?.data?.message || "Complete an interview before generating a plan.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handlePlanStatus = async (recommendationId, status) => {
    try {
      await api.patch(`/interviews/improvement-plan/${recommendationId}`, { status });
      setPlan((current) => ({ ...current, recommendations: current.recommendations.map((item) => item._id === recommendationId ? { ...item, status } : item) }));
    } catch (statusError) {
      setError(statusError.response?.data?.message || "Could not update recommendation status.");
    }
  };

  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const params = new URLSearchParams({ page: String(filters.page), limit: "10" });
        if (filters.role) params.set("role", filters.role);
        if (filters.type) params.set("type", filters.type);
        if (filters.difficulty) params.set("difficulty", filters.difficulty);
        const { data } = await api.get(`/interviews/history?${params.toString()}`);
        setHistory(data);
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Could not load interview history.");
      } finally {
        setIsLoadingHistory(false);
      }
    };
    loadHistory();
  }, [filters]);

  const categoryLabels = {
    correctness: "Correctness",
    confidence: "Confidence",
    communication: "Communication",
    technicalAccuracy: "Technical accuracy",
  };

  return (
    <main className="analytics-page">
      <button className="text-button" onClick={() => navigate("/dashboard")}><FiArrowLeft /> Back to dashboard</button>
      <header className="analytics-header">
        <div><p className="eyebrow">Progress analytics</p><h1>Your interview performance</h1><p>Track completed interviews, category scores and improvement over time.</p></div>
        <div className="analytics-header-actions"><button className="primary-button" onClick={() => navigate("/interview/setup")}>Start new interview</button><button className="secondary-button" onClick={handleLogout}>Log out</button></div>
      </header>

      {error && <p className="status-message error-message">{error}</p>}

      {isLoadingAnalytics ? <p className="analytics-loading">Calculating your progress...</p> : analytics && (
        <>
          <ProgressSummary summary={analytics.summary} />
          <section className="analytics-two-column">
            <article className="analytics-card trend-card">
              <div className="analytics-section-heading"><div><p className="eyebrow">Score trend</p><h2>Progress over time</h2></div><span>Latest: {analytics.summary.latestScore ?? "—"}</span></div>
              <PerformanceChart data={analytics.scoreTrend} />
            </article>
            <article className="analytics-card">
              <div className="analytics-section-heading"><div><p className="eyebrow">Category analysis</p><h2>Average scores</h2></div></div>
              <div className="category-analytics-list">
                {Object.entries(analytics.categoryAverages).map(([category, score]) => (
                  <div key={category}><div><span>{categoryLabels[category]}</span><strong>{score ?? "—"}</strong></div><div className="category-progress"><i style={{ width: `${score || 0}%` }} /></div></div>
                ))}
              </div>
              <div className="category-insights">
                <p><strong>Strongest:</strong> {analytics.summary.strongestCategory?.name || "Complete an interview"}</p>
                <p><strong>Needs focus:</strong> {analytics.summary.weakestCategory?.name || "Complete an interview"}</p>
              </div>
            </article>
          </section>

          <section className="analytics-card suggestions-card">
            <div className="analytics-section-heading"><div><p className="eyebrow">Improvement plan</p><h2>Repeated recommendations</h2></div><FiTarget /></div>
            {analytics.improvementSuggestions.length ? (
              <ol>{analytics.improvementSuggestions.map((item) => <li key={item.suggestion}><span>{item.suggestion}</span>{item.count > 1 && <strong>Appeared {item.count} times</strong>}</li>)}</ol>
            ) : <p className="history-state">Complete interviews to receive personalized improvement recommendations.</p>}
          </section>

          <section className="analytics-card plan-card">
            <div className="analytics-section-heading">
              <div><p className="eyebrow">Personalized learning</p><h2>Your improvement plan</h2></div>
              <button className="secondary-button" onClick={handleGeneratePlan} disabled={isGeneratingPlan}>{isGeneratingPlan ? "Creating..." : "Generate plan"}</button>
            </div>
            {isPlanLoading ? <p className="history-state">Loading your plan...</p> : plan?.recommendations?.length ? (
              <div className="plan-list">{plan.recommendations.map((item) => (
                <article className="plan-item" key={item._id}>
                  <div className="plan-content"><h3>{item.area}</h3><p>{item.recommendation}</p><p><strong>Learn:</strong> {item.explanation || learningFallbacks[item.area]?.explanation}</p><p><strong>Key concepts:</strong> {(item.keyConcepts?.length ? item.keyConcepts : learningFallbacks[item.area]?.keyConcepts || []).join(" • ")}</p><p><strong>Example:</strong> {item.example || learningFallbacks[item.area]?.example}</p><details><summary>Practice questions</summary><ol>{(item.practiceQuestions?.length ? item.practiceQuestions : learningFallbacks[item.area]?.practiceQuestions || ["Complete a practice question for this skill."]).map((question) => <li key={question}>{question}</li>)}</ol></details><button className="text-button" onClick={() => navigate("/interview/setup")}>Practice this skill →</button></div>
                  <select value={item.status} onChange={(event) => handlePlanStatus(item._id, event.target.value)} aria-label={`Status for ${item.area}`}>
                    <option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option>
                  </select>
                </article>
              ))}</div>
            ) : <p className="history-state">Complete an interview, then generate your personalized plan.</p>}
          </section>
        </>
      )}

      <InterviewHistory
        filters={filters}
        history={history}
        isLoading={isLoadingHistory}
        onFiltersChange={setFilters}
        onOpenReport={(interviewId) => navigate(`/interview/${interviewId}/report`)}
        onPageChange={(page) => setFilters((current) => ({ ...current, page }))}
      />
    </main>
  );
}

export default AnalyticsDashboard;
