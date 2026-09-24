import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaLock, FaRobot } from "react-icons/fa";
import api from "../api/axios";
import "../App.css";

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password, confirmPassword });
      navigate("/", { replace: true, state: { message: data.message } });
    } catch (resetError) {
      setError(resetError.response?.data?.message || "Unable to reset the password. Request a new link.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo"><FaRobot /></div>
        <h1>Set New Password</h1>
        <p className="subtitle">Choose a password with 8+ characters, uppercase, lowercase, and a special character.</p>

        <div className="input-box"><FaLock className="icon" /><input type="password" placeholder="New password" value={password} onChange={(event) => setPassword(event.target.value)} minLength="8" pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}" title="Use at least 8 characters with uppercase, lowercase, and special character." required /></div>
        <div className="input-box"><FaLock className="icon" /><input type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} minLength="8" required /></div>
        <p className="password-hint">Use 8+ characters with at least one uppercase letter, one lowercase letter, and one special character.</p>

        {error && <p className="status-message error-message">{error}</p>}
        <button type="submit" disabled={isLoading}>{isLoading ? "Resetting password..." : "Reset password"}</button>
        <p className="bottom-text"><Link to="/forgot-password"><span>Request another reset link</span></Link></p>
      </form>
    </div>
  );
}

export default ResetPassword;
