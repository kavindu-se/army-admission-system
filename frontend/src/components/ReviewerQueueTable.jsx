import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import { deleteApplication, getApplications, getMyActions } from "../api.js";
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

export default function ReviewerQueueTable({ activePanel, onChangePanel, returnTo }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [historyApps, setHistoryApps] = useState([]);
  const panel = activePanel || "inbox";
  const returnPath = returnTo || "/dashboard";

  useEffect(() => {
    if (!token) return;
    getApplications().then((res) => setApps(res.data));
    if (user && !user?.roles?.includes("Applicant")) {
      getMyActions().then((res) => setHistoryApps(res.data));
    }
  }, [token, user]);

  const handleDelete = async (appId) => {
    const ok = window.confirm("Delete this application permanently?");
    if (!ok) return;
    await deleteApplication(appId);
    const appsRes = await getApplications();
    setApps(appsRes.data);
    if (user && !user?.roles?.includes("Applicant")) {
      const historyRes = await getMyActions();
      setHistoryApps(historyRes.data);
    }
  };

  const approved = historyApps.filter((app) => app.status === "dte_approved");
  const rejected = historyApps.filter((app) => app.status === "rejected");
  const inProgress = historyApps.filter(
    (app) => app.status !== "dte_approved" && app.status !== "rejected"
  );
  const reviewerData = {
    inbox: apps,
    in_progress: inProgress,
    approved,
    rejected
  };
  const reviewerList = reviewerData[panel] || [];
  const reviewerCounts = {
    inbox: reviewerData.inbox.length,
    in_progress: reviewerData.in_progress.length,
    approved: reviewerData.approved.length,
    rejected: reviewerData.rejected.length
  };

  return (
    <div className="card">
      <div className="page-header">
        <h3>Approval Queue</h3>
        <div className="tab-toggle">
          <button
            type="button"
            className={`tab-btn ${panel === "inbox" ? "active" : ""}`}
            onClick={() => onChangePanel("inbox")}
          >
            INBOX
            <span className="tab-badge">{reviewerCounts.inbox}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${panel === "in_progress" ? "active" : ""}`}
            onClick={() => onChangePanel("in_progress")}
          >
            ON PROGRESS
            <span className="tab-badge">{reviewerCounts.in_progress}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${panel === "approved" ? "active" : ""}`}
            onClick={() => onChangePanel("approved")}
          >
            APPROVED
            <span className="tab-badge">{reviewerCounts.approved}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${panel === "rejected" ? "active" : ""}`}
            onClick={() => onChangePanel("rejected")}
          >
            REJECTED
            <span className="tab-badge">{reviewerCounts.rejected}</span>
          </button>
        </div>
      </div>
      <div className="table-scroll">
        <table className="history-table">
          <thead>
            <tr>
              <th>Service No</th>
              <th>Rank</th>
              <th>Name</th>
              <th>Regiment</th>
              <th>Unit</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {reviewerList.map((app) => {
              const formA = parseFormA(app?.form_a_json) || {};
              const serviceNo = formA.service_number || app?.service_no || "-";
              const rank = formA.rank_designation || "-";
              const regiment = app?.regiment_name || formA.regiment_name || "-";
              const unit = app?.unit_no || formA.unit_name || "-";
              return (
                <tr key={app.id}>
                  <td>{serviceNo}</td>
                  <td>{rank}</td>
                  <td>{formatNameWithInitials(resolveApplicantName(app)) || "-"}</td>
                  <td>{regiment || "-"}</td>
                  <td>{unit || "-"}</td>
                  <td>{formatStatus(app.status)}</td>
                  <td>
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() =>
                        navigate(
                          `/review/${app.id}?panel=${panel}&return=${encodeURIComponent(
                            returnPath
                          )}`
                        )
                      }
                    >
                      View
                    </button>
                    <button
                      type="button"
                      className="danger-btn"
                      onClick={() => handleDelete(app.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {reviewerList.length === 0 && (
              <tr>
                <td colSpan="7" className="muted">
                  No requests in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
