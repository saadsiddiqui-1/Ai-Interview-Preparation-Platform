import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import api from "../api/axios";
import "../App.css";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const updateField = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/register", form);
      localStorage.removeItem("authToken");
      localStorage.removeItem("currentUser");
      localStorage.removeItem("latestResumeAnalysis");
      navigate("/", { replace: true, state: { message: data.message } });
    } catch (registerError) {
      setError(registerError.response?.data?.message || "Unable to create the account. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Create Account</h1>
        <p className="subtitle">Register before starting your interview preparation</p>

        <input name="name" type="text" placeholder="Full Name" value={form.name} onChange={updateField} minLength="2" required />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={updateField} required />
        <div className="password-input-box"><input name="password" type={showPassword ? "text" : "password"} placeholder="Password" value={form.password} onChange={updateField} minLength="8" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}" title="Use at least 8 characters with uppercase, lowercase, and special character." required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button></div>
        <p className="password-hint">Use 8+ characters with at least one uppercase letter, one lowercase letter, and one special character.</p>

        {error && <p className="status-message error-message">{error}</p>}
        <button type="submit" disabled={isLoading}>{isLoading ? "Creating account..." : "Register"}</button>

        <p className="bottom-text">Already have an account? <Link to="/"><span>Login</span></Link></p>
      </form>
    </div>
  );
}

export default Register;
