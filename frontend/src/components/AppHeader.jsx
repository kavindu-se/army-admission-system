import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("theme") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <header className="app-header">
      <div className="brand" onClick={() => navigate("/dashboard")}>
        School Admission Management System
      </div>
      <div className="header-right">
        {user && <span className="user-chip">{user.name}</span>}
        <button
          className="ghost-btn"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          type="button"
        >
          {theme === "dark" ? "Light Mode" : "Dark Mode"}
        </button>
        {user && (
          <button className="ghost-btn" onClick={logout}>
            Logout
          </button>
        )}
      </div>
    </header>
  );
}
