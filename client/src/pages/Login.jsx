import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaEnvelope, FaEye, FaEyeSlash, FaLock, FaRobot } from "react-icons/fa";
import api from "../api/axios";
import "../App.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });
      const previousUser = JSON.parse(localStorage.getItem("currentUser") || "null");
      if (previousUser?.id !== data.user.id) {
        localStorage.removeItem("latestResumeAnalysis");
      }
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      const destination = data.user.role === "admin" ? "/admin" : (location.state?.from || "/dashboard");
      navigate(destination, { replace: true });
    } catch (loginError) {
      setError(loginError.response?.data?.message || "Unable to log in. Make sure the backend is running.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo"><FaRobot /></div>
        <h1>AI Interview Preparation Platform</h1>
        <p className="subtitle">Login to continue</p>

        <div className="input-box">
          <FaEnvelope className="icon" />
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>
        <div className="input-box password-input-box">
          <FaLock className="icon" />
          <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <FaEyeSlash /> : <FaEye />}</button>
        </div>

        {location.state?.message && !error && <p className="status-message success-message">{location.state.message}</p>}
        {error && <p className="status-message error-message">{error}</p>}

        <button type="submit" disabled={isLoading}>{isLoading ? "Logging in..." : "Login"}</button>
        <p className="auth-link"><Link to="/forgot-password">Forgot password?</Link></p>
        <p className="bottom-text">Don't have an account? <Link to="/register"><span>Create an account</span></Link></p>
      </form>
    </div>
  );
}

export default Login;
