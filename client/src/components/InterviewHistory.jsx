import { FiChevronLeft, FiChevronRight, FiEye, FiSearch } from "react-icons/fi";

function InterviewHistory({ filters, history, isLoading, onFiltersChange, onOpenReport, onPageChange }) {
  const { interviews = [], pagination = {} } = history || {};

  const handleSubmit = (event) => {
    event.preventDefault();
    onFiltersChange({ ...filters, role: event.currentTarget.elements.role.value.trim(), page: 1 });
  };

  return (
    <section className="history-section">
      <div className="analytics-section-heading">
        <div><p className="eyebrow">Interview history</p><h2>Previous interviews</h2></div>
        <span>{pagination.total || 0} completed</span>
      </div>

      <form className="history-filters" onSubmit={handleSubmit}>
        <label>
          Search role
          <div className="history-search"><FiSearch /><input name="role" defaultValue={filters.role} placeholder="e.g. Software Developer" /></div>
        </label>
        <label>
          Interview type
          <select value={filters.type} onChange={(event) => onFiltersChange({ ...filters, type: event.target.value, page: 1 })}>
            <option value="">All types</option><option>HR</option><option>Technical</option><option>Behavioral</option><option>Mixed</option>
          </select>
        </label>
        <label>
          Difficulty
          <select value={filters.difficulty} onChange={(event) => onFiltersChange({ ...filters, difficulty: event.target.value, page: 1 })}>
            <option value="">All difficulties</option><option>Beginner</option><option>Intermediate</option><option>Advanced</option>
          </select>
        </label>
        <button type="submit" className="secondary-button">Apply</button>
      </form>

      {isLoading ? (
        <p className="history-state">Loading interview history...</p>
      ) : interviews.length ? (
        <div className="history-table-wrapper">
          <table className="history-table">
            <thead><tr><th>Role</th><th>Type</th><th>Difficulty</th><th>Score</th><th>Completed</th><th>Report</th></tr></thead>
            <tbody>
              {interviews.map((interview) => (
                <tr key={interview._id}>
                  <td><strong>{interview.role}</strong><span>{interview.questionCount} questions</span></td>
                  <td>{interview.type}</td><td>{interview.difficulty}</td>
                  <td><strong className="history-score">{interview.score}</strong>/100</td>
                  <td>{new Date(interview.completedAt || interview.createdAt).toLocaleDateString()}</td>
                  <td><button type="button" className="report-link" onClick={() => onOpenReport(interview._id)}><FiEye /> View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="history-state">No completed interviews match these filters.</p>
      )}

      {pagination.pages > 1 && (
        <div className="history-pagination">
          <button disabled={pagination.page <= 1} onClick={() => onPageChange(pagination.page - 1)}><FiChevronLeft /> Previous</button>
          <span>Page {pagination.page} of {pagination.pages}</span>
          <button disabled={pagination.page >= pagination.pages} onClick={() => onPageChange(pagination.page + 1)}>Next <FiChevronRight /></button>
        </div>
      )}
    </section>
  );
}

export default InterviewHistory;
