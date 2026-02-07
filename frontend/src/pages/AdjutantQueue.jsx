import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import { getApplications, getMyActions } from "../api.js";
import crest from "../assets/Sri_Lanka_Army_Logo.png";
import { formatNameWithInitials } from "../utils/name.js";

function formatStatus(status) {
  if (!status) return "-";
  return status.replace(/_/g, " ").toUpperCase();
}

function parseFormA(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function resolveApplicantName(app) {
  const formA = parseFormA(app?.form_a_json);
  return (
    app?.applicant_name ||
    formA?.applicant_name_initials ||
    formA?.applicant_full_name_caps ||
    ""
  );
}

export default function AdjutantQueue() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [historyApps, setHistoryApps] = useState([]);
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem("adjutantQueue.viewMode") || "pending"
  );

  useEffect(() => {
    localStorage.setItem("adjutantQueue.viewMode", viewMode);
  }, [viewMode]);

  const loadQueue = () => {
    getApplications().then((res) => setApps(res.data));
  };

  const loadHistory = () => {
    getMyActions().then((res) => setHistoryApps(res.data));
  };

  useEffect(() => {
    if (token) {
      loadQueue();
      loadHistory();
    }
  }, [token]);


  const list = viewMode === "pending" ? apps : historyApps;
  const pendingCount = apps.length;
  const historyCount = historyApps.length;
  const roleLabel = (() => {
    const roles = user?.roles || [];
    if (roles.includes("Admin")) return "Admin";
    if (roles.includes("Applicant")) return "Applicant";
    if (roles.length > 0) return roles[0];
    return "Reviewer";
  })();

  return (
    <div className="page dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="profile-card">
          <img className="profile-avatar" src={crest} alt="Reviewer Avatar" />
          <div>
            <div className="profile-name">
              {formatNameWithInitials(user?.name) || "Reviewer"}
            </div>
            <div className="profile-role">{roleLabel}</div>
          </div>
        </div>
        <nav className="side-menu">
          <button className="side-link active" onClick={() => navigate("/adjutant")}>
            PENDING/ACTIONS
          </button>
        </nav>
      </aside>
      <main className="dashboard-main">
        <div className="page-header">
          <h2>Adjutant Pending / Actions</h2>
          <div className="tab-toggle">
            <button
              type="button"
              className={`tab-btn ${viewMode === "pending" ? "active" : ""}`}
              onClick={() => setViewMode("pending")}
            >
              Pending
              <span className="tab-badge">{pendingCount}</span>
            </button>
            <button
              type="button"
              className={`tab-btn ${viewMode === "history" ? "active" : ""}`}
              onClick={() => setViewMode("history")}
            >
              Actions
              <span className="tab-badge">{historyCount}</span>
            </button>
          </div>
        </div>
        <div className="queue-list">
          {list.map((app) => (
            <button
              key={app.id}
              className="queue-item"
              onClick={() => navigate(`/review/${app.id}`)}
            >
              <div className="queue-item-title">
                {formatNameWithInitials(resolveApplicantName(app)) ||
                  "Applicant"}
              </div>
              <div className="queue-item-meta">
                <span className="queue-item-status">{formatStatus(app.status)}</span>
                <span className="stage-chip">{app.current_stage}</span>
              </div>
              {viewMode === "history" && app.last_action_at && (
                <small className="muted queue-item-history">
                  {app.last_action}{" "}
                  {new Date(app.last_action_at).toLocaleDateString()}
                </small>
              )}
            </button>
          ))}
          {list.length === 0 && (
            <div className="card muted">
              {viewMode === "pending"
                ? "Queue is empty."
                : "No actions taken yet."}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
