import { FiActivity, FiAward, FiBarChart2, FiTrendingUp } from "react-icons/fi";

const formatScore = (score) => Number.isFinite(score) ? `${score}` : "—";

function ProgressSummary({ summary }) {
  const improvement = summary?.scoreImprovement;
  const improvementText = Number.isFinite(improvement)
    ? `${improvement > 0 ? "+" : ""}${improvement}`
    : "—";
  const cards = [
    { label: "Completed interviews", value: summary?.totalInterviews ?? 0, icon: FiActivity },
    { label: "Average score", value: formatScore(summary?.averageScore), icon: FiBarChart2 },
    { label: "Highest score", value: formatScore(summary?.highestScore), icon: FiAward },
    { label: "Overall improvement", value: improvementText, icon: FiTrendingUp },
  ];

  return (
    <section className="analytics-summary-grid" aria-label="Performance summary">
      {cards.map(({ label, value, icon: Icon }) => (
        <article key={label}>
          <Icon aria-hidden="true" />
          <div><strong>{value}</strong><span>{label}</span></div>
        </article>
      ))}
    </section>
  );
}

export default ProgressSummary;
