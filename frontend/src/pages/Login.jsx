import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import crest from "../assets/Sri_Lanka_Army_Logo.png";

export default function Login() {
  const { loginAuto } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const nextUser = await loginAuto(username, password);
      const isAdmin =
        nextUser?.roles?.includes("Admin") ||
        nextUser?.roles?.includes("RHQAdmin");
      navigate(isAdmin ? "/admin" : "/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed");
    }
  };

  return (
    <div className="login-shell">
      <div className="login-left">
        <img className="login-crest" src={crest} alt="Sri Lanka Army Crest" />
        <h1 className="login-title">
          SCHOOL ADMISSION
          <span>MANAGEMENT SYSTEM</span>
        </h1>
        <h2 className="login-welcome">Welcome back</h2>
        <p className="login-sub">Sri Lanka Army Headquarters</p>
      </div>
      <div className="login-right">
        <div className="login-panel">
          <h3>Sign in</h3>
          <p className="login-note" />
          {error && <div className="error">{error}</div>}
          <form onSubmit={handleSubmit} className="login-form">
            <label>
              Username or Email
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="100277898 or kavindu@gmail.com"
                required
              />
            </label>
            <label>
              Password
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                required
              />
            </label>
            <button type="submit" className="login-btn">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
