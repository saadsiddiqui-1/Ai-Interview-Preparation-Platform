function PerformanceChart({ data }) {
  if (!data?.length) {
    return <div className="chart-empty">Complete an interview to start your performance graph.</div>;
  }

  const width = 760;
  const height = 260;
  const padding = 42;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;
  const points = data.map((item, index) => {
    const x = data.length === 1
      ? width / 2
      : padding + (index / (data.length - 1)) * chartWidth;
    const y = padding + ((100 - item.score) / 100) * chartHeight;
    return { ...item, x, y };
  });

  return (
    <div className="performance-chart">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Interview score trend">
        {[0, 25, 50, 75, 100].map((score) => {
          const y = padding + ((100 - score) / 100) * chartHeight;
          return (
            <g key={score}>
              <line x1={padding} x2={width - padding} y1={y} y2={y} className="chart-grid-line" />
              <text x={padding - 10} y={y + 4} textAnchor="end" className="chart-axis-label">{score}</text>
            </g>
          );
        })}
        {points.length > 1 && (
          <polyline points={points.map(({ x, y }) => `${x},${y}`).join(" ")} className="chart-line" />
        )}
        {points.map((point) => (
          <g key={point.interviewId}>
            <circle cx={point.x} cy={point.y} r="6" className="chart-point" />
            <text x={point.x} y={point.y - 13} textAnchor="middle" className="chart-score">{point.score}</text>
            <text x={point.x} y={height - 12} textAnchor="middle" className="chart-axis-label">#{point.sequence}</text>
            <title>{`${point.role}: ${point.score}/100`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default PerformanceChart;
