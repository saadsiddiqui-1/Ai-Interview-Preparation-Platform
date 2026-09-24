import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiUsers, FiFileText, FiMessageSquare, FiCheckCircle, FiSearch } from "react-icons/fi";
import api from "../api/axios";
import "../App.css";

function AdminDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [users, setUsers] = useState({ users: [], pagination: {} });
  const [search, setSearch] = useState("");
  const [userPage, setUserPage] = useState(1);
  const handleLogout = () => {
    localStorage.removeItem("authToken"); localStorage.removeItem("currentUser"); localStorage.removeItem("latestResumeAnalysis");
    navigate("/", { replace: true, state: { message: "You have been logged out." } });
  };

  useEffect(() => {
    api.get("/admin/overview").then(({ data }) => setOverview(data.overview)).catch((loadError) => setError(loadError.response?.data?.message || "Could not load administrator overview."));
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const params = new URLSearchParams({ page: String(userPage), limit: "10" });
        if (search.trim()) params.set("search", search.trim());
        const { data } = await api.get(`/admin/users?${params.toString()}`);
        setUsers(data);
      } catch (loadError) { setError(loadError.response?.data?.message || "Could not load users."); }
    };
    loadUsers();
  }, [search, userPage]);

  return <main className="analytics-page">
    <button className="text-button" onClick={() => navigate("/dashboard")}><FiArrowLeft /> Back to dashboard</button>
    <header className="analytics-header"><div><p className="eyebrow">Platform administration</p><h1>Administrator overview</h1><p>Monitor platform usage and interview activity.</p></div><button className="secondary-button" onClick={handleLogout}>Log out</button></header>
    {error && <p className="status-message error-message">{error}</p>}
    {overview && <>
      <section className="admin-stat-grid">
        <article className="analytics-card admin-stat"><FiUsers /><strong>{overview.users}</strong><span>Registered users</span></article>
        <article className="analytics-card admin-stat"><FiFileText /><strong>{overview.resumes}</strong><span>Resumes analyzed</span></article>
        <article className="analytics-card admin-stat"><FiMessageSquare /><strong>{overview.interviews}</strong><span>Interviews created</span></article>
        <article className="analytics-card admin-stat"><FiCheckCircle /><strong>{overview.completedInterviews}</strong><span>Completed interviews</span></article>
      </section>
      <section className="analytics-card suggestions-card"><div className="analytics-section-heading"><div><p className="eyebrow">Popular roles</p><h2>Most practiced target roles</h2></div></div>
        {overview.topRoles.length ? <ol>{overview.topRoles.map((item) => <li key={item.role}><span>{item.role}</span><strong>{item.count} interviews</strong></li>)}</ol> : <p className="history-state">No interview activity yet.</p>}
      </section>
      <section className="analytics-card admin-users-card"><div className="analytics-section-heading"><div><p className="eyebrow">User directory</p><h2>Registered users</h2></div><span>{users.pagination.total || 0} total</span></div>
        <form className="admin-search" onSubmit={(event) => { event.preventDefault(); setUserPage(1); }}><FiSearch /><input value={search} onChange={(event) => { setSearch(event.target.value); setUserPage(1); }} placeholder="Search by name or email" /></form>
        <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Joined</th><th>Resumes</th><th>Interviews</th><th>Completed</th></tr></thead><tbody>{users.users.map((user) => <tr key={user._id}><td>{user.name}{user.role === "admin" && <small>Admin</small>}</td><td>{user.email}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td>{user.resumeCount}</td><td>{user.interviewCount}</td><td>{user.completedInterviewCount}</td></tr>)}</tbody></table></div>
        {!users.users.length && <p className="history-state">No users match your search.</p>}
        {users.pagination.pages > 1 && <div className="admin-pagination"><button disabled={userPage <= 1} onClick={() => setUserPage((page) => page - 1)}>Previous</button><span>Page {userPage} of {users.pagination.pages}</span><button disabled={userPage >= users.pagination.pages} onClick={() => setUserPage((page) => page + 1)}>Next</button></div>}
      </section>
    </>}
  </main>;
}

export default AdminDashboard;
