import { useState } from "react";
import { Link } from "react-router-dom";
import { FaEnvelope, FaRobot } from "react-icons/fa";
import api from "../api/axios";
import "../App.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const { data } = await api.post("/auth/forgot-password", { email });
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to send a reset link. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="logo"><FaRobot /></div>
        <h1>Forgot Password</h1>
        <p className="subtitle">Enter your registered email address and we will send a reset link.</p>

        <div className="input-box">
          <FaEnvelope className="icon" />
          <input type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
        </div>

        {message && <p className="status-message success-message">{message}</p>}
        {error && <p className="status-message error-message">{error}</p>}
        <button type="submit" disabled={isLoading}>{isLoading ? "Sending link..." : "Send reset link"}</button>
        <p className="bottom-text"><Link to="/"><span>Back to login</span></Link></p>
      </form>
    </div>
  );
}

export default ForgotPassword;
