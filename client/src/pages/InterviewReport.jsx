import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiAward, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import api from "../api/axios";
import "../App.css";

function InterviewReport() {
  const { interviewId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState(
    location.state?.interview?._id === interviewId ? location.state : null
  );
  const [isLoading, setIsLoading] = useState(!reportData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (reportData) return;

    const loadReport = async () => {
      try {
        const [interviewResponse, answersResponse] = await Promise.all([
          api.get(`/interviews/${interviewId}`),
          api.get(`/answers/${interviewId}`),
        ]);
        if (interviewResponse.data.interview.status !== "completed") {
          setError("This interview has not been completed yet.");
          return;
        }
        setReportData({
          interview: interviewResponse.data.interview,
          answers: answersResponse.data.answers,
          questions: interviewResponse.data.questions,
        });
      } catch (loadError) {
        setError(loadError.response?.data?.message || "Could not load the performance report.");
      } finally {
        setIsLoading(false);
      }
    };

    loadReport();
  }, [interviewId, reportData]);

  if (isLoading) {
    return <main className="report-page"><p className="interview-state">Preparing report...</p></main>;
  }

  if (error || !reportData?.interview?.performanceReport) {
    return (
      <main className="report-page">
        <section className="interview-state">
          <h1>Report unavailable</h1>
          <p>{error || "No performance report was found."}</p>
          <button onClick={() => navigate(`/interview/${interviewId}`)}>Return to interview</button>
        </section>
      </main>
    );
  }

  const { interview, answers, questions = [] } = reportData;
  const report = interview.performanceReport;
  const categoryScores = [
    ["Correctness", report.categoryScores.correctness],
    ["Confidence", report.categoryScores.confidence],
    ["Communication", report.categoryScores.communication],
    ["Technical accuracy", report.categoryScores.technicalAccuracy],
  ];

  return (
    <main className="report-page">
      <button className="text-button" onClick={() => navigate("/dashboard")}>
        <FiArrowLeft /> Back to dashboard
      </button>

      <header className="report-header">
        <div>
          <p className="eyebrow">Performance report</p>
          <h1>{interview.role}</h1>
          <p>{interview.type} interview · {interview.difficulty}</p>
        </div>
        <div className="overall-score">
          <FiAward />
          <strong>{interview.score}</strong>
          <span>Overall score</span>
        </div>
      </header>

      <section className="report-category-grid" aria-label="Category scores">
        {categoryScores.map(([label, score]) => (
          <article key={label}>
            <strong>{score}</strong>
            <span>{label}</span>
            <div><i style={{ width: `${score}%` }} /></div>
          </article>
        ))}
      </section>

      <section className="report-feedback-grid">
        {[
          ["Key strengths", report.strengths, "strength-report"],
          ["Areas to improve", report.weaknesses, "weakness-report"],
          ["Recommended actions", report.suggestions, "suggestion-report"],
        ].map(([title, items, className]) => (
          <article className={`report-feedback-card ${className}`} key={title}>
            <h2>{title}</h2>
            <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
        ))}
      </section>

      <section className="question-review">
        <div className="question-review-heading">
          <div>
            <p className="eyebrow">Detailed review</p>
            <h2>Question-by-question performance</h2>
          </div>
          <span><FiCheckCircle /> {report.answeredQuestions} answered</span>
        </div>
        {questions.map((question, index) => {
          const answer = answers.find((item) => item.questionId === question._id);
          if (!answer) return null;
          return (
            <details key={answer._id}>
              <summary>
                <span>Question {index + 1}: {question.question}</span>
                <strong>{answer.scores.overall}/100</strong>
              </summary>
              <p className="review-answer"><strong>Your answer:</strong> {answer.answer}</p>
              <p><strong>Suggestion:</strong> {answer.suggestions[0]}</p>
            </details>
          );
        })}
      </section>

      <div className="report-actions">
        <button className="secondary-button" onClick={() => navigate("/dashboard")}>Dashboard</button>
        <button className="primary-button" onClick={() => navigate("/interview/setup")}>
          <FiRefreshCw /> Start another interview
        </button>
      </div>
    </main>
  );
}

export default InterviewReport;
