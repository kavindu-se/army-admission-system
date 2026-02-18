import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import {
  API_BASE,
  deleteApplication as apiDeleteApplication,
  downloadPdf as apiDownloadPdf,
  getApplication,
  getAttachments,
  getSteps,
  takeAction as apiTakeAction
} from "../api.js";
import crest from "../assets/Sri_Lanka_Army_Logo.png";
import { formatNameWithInitials } from "../utils/name.js";
import SidebarIcon from "../components/SidebarIcon.jsx";

const ROLE_ACTIONS = {
  UnitSubjectClerk: ["return", "forward"],
  UnitAdjutant: ["return", "forward"],
  UnitCO: ["reject", "recommend"],
  RHQSubjectClerk: ["return", "forward"],
  RHQGSO: ["return", "forward"],
  CentreCommandant: ["return", "recommend"],
  GSO1: ["return", "forward"],
  DteWelfareClerk: ["return", "forward"],
  DteWelfareDirector: ["return", "forward"],
  DteWelfareGSO2: ["approve", "reject"]
};

const LEVEL_LABELS = {
  Applicant: "Applicant",
  UnitSubjectClerk: "Unit Subject Clerk",
  UnitAdjutant: "Unit Adjutant",
  UnitCO: "Unit CO",
  RHQSubjectClerk: "RHQ Subject Clerk",
  CentreCommandant: "Center Commandant",
  GSO1: "GSO1",
  DteWelfareClerk: "Dte Welfare Clerk",
  DteWelfareDirector: "Dte Welfare Director",
  DteWelfareGSO2: "Dte Welfare GSO II"
};

function displayLevel(step) {
  if (step.level === "CommandApprovals") {
    const roles = step.actor_roles || "";
    if (roles.includes("CentreCommandant")) return "Center Commandant";
    if (roles.includes("GSO1")) return "GSO1";
    return "Command Approval";
  }
  if (step.level === "DteWelfareClerk") {
    const roles = step.actor_roles || "";
    if (roles.includes("DteWelfareDirector")) return "Dte Welfare Director";
  }
  return LEVEL_LABELS[step.level] || step.level;
}

function parseJson(input) {
  if (!input) return {};
  if (typeof input === "object") return input;
  try {
    return JSON.parse(input);
  } catch {
    return {};
  }
}

function formatStatus(status) {
  if (!status) return "-";
  return status.replace(/_/g, " ").toUpperCase();
}

function formatStampComment(comment) {
  if (!comment) return comment;
  const lines = String(comment).split("\n");
  const formatted = lines.map((line) => {
    const match = line.match(/^\[(Adjutant|CO|Centre Commandant) Stamp:\s*(.+)\]$/);
    if (!match) return line;
    const parts = match[2].split(" / ").map((part) => part.trim());
    if (parts.length === 0) return line;
    const name = formatNameWithInitials(parts[0] || "");
    const rest = parts.slice(1).filter(Boolean).join(" / ");
    return [name, rest].filter(Boolean).join(" / ");
  });
  return formatted.join("\n");
}

export default function ReviewDetail() {
  const { token, user } = useAuth();
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [steps, setSteps] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [comment, setComment] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const previewRef = useRef(null);
  const isAdjutant = user?.roles?.includes("UnitAdjutant");
  const isUnitCO = user?.roles?.includes("UnitCO");
  const isCentreCommandant = user?.roles?.includes("CentreCommandant");

  useEffect(() => {
    if (!token || !id) return;
    getApplication(id)
      .then((res) => setSelectedDetail(res.data))
      .catch(() => setSelectedDetail(null));
    getSteps(id)
      .then((res) => setSteps(res.data))
      .catch(() => setSteps([]));
    getAttachments(id)
      .then((res) => setAttachments(res.data))
      .catch(() => setAttachments([]));
  }, [token, id]);

  useEffect(() => {
    if (previewUrl && previewRef.current) {
      previewRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [previewUrl]);

  const takeAction = async (action) => {
    if (!selectedDetail) return;
    let nextComment = comment;
    if (isAdjutant) {
      const parts = [
        formatNameWithInitials(user?.name || ""),
        user?.service_no || "",
        user?.regiment || "",
        user?.unit_no || ""
      ].filter(Boolean);
      const stamp = `[Adjutant Stamp: ${parts.join(" / ")}]`.trim();
      nextComment = nextComment ? `${nextComment}\n${stamp}` : stamp;
    }
    if (isUnitCO && action === "recommend") {
      const parts = [
        formatNameWithInitials(user?.name || ""),
        user?.service_no || "",
        user?.regiment || "",
        user?.unit_no || ""
      ].filter(Boolean);
      const stamp = `[CO Stamp: ${parts.join(" / ")}]`.trim();
      nextComment = nextComment ? `${nextComment}\n${stamp}` : stamp;
    }
    if (isCentreCommandant && action === "recommend") {
      const parts = [
        formatNameWithInitials(user?.name || ""),
        user?.service_no || "",
        user?.regiment || "",
        user?.unit_no || ""
      ].filter(Boolean);
      const stamp = `[Centre Commandant Stamp: ${parts.join(" / ")}]`.trim();
      nextComment = nextComment ? `${nextComment}\n${stamp}` : stamp;
    }
    await apiTakeAction(selectedDetail.id, action, nextComment);
    setComment("");
    setPreviewUrl("");
    navigate(returnTo);
  };

  const deleteApplication = async () => {
    if (!selectedDetail) return;
    const ok = window.confirm(
      "Delete this application permanently? This cannot be undone."
    );
    if (!ok) return;
    await apiDeleteApplication(selectedDetail.id);
    setPreviewUrl("");
    navigate(returnTo);
  };

  const downloadPdf = async () => {
    if (!selectedDetail) return;
    const res = await apiDownloadPdf(selectedDetail.id);
    const blobUrl = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${selectedDetail.application_no}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const viewPdf = async () => {
    if (!selectedDetail) return;
    const res = await apiDownloadPdf(selectedDetail.id);
    const blobUrl = window.URL.createObjectURL(res.data);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(blobUrl);
  };

  const closePreview = () => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
  };

  const allowedActions = useMemo(() => {
    const roles = user?.roles || [];
    const actions = new Set();
    roles.forEach((role) => {
      (ROLE_ACTIONS[role] || []).forEach((action) => actions.add(action));
    });
    return Array.from(actions);
  }, [user]);

  const formA = parseJson(selectedDetail?.form_a_json);
  const isAdmin = user?.roles?.includes("Admin");
  const isMasterAdmin =
    String(user?.service_no || "").toLowerCase() === "kavindu@gmail.com";
  const roleLabel = (() => {
    const roles = user?.roles || [];
    if (roles.includes("Admin")) return "Admin";
    if (roles.includes("Applicant")) return "Applicant";
    if (roles.length > 0) return roles[0];
    return "Reviewer";
  })();
  const searchParams = new URLSearchParams(location.search);
  const panelParam = searchParams.get("panel");
  const returnParam = searchParams.get("return");
  const returnTo = returnParam || "/dashboard";
  const reviewerPanel =
    panelParam || localStorage.getItem("dashboard.activePanel") || "inbox";
  const setReviewerPanel = (panel) => {
    localStorage.setItem("dashboard.activePanel", panel);
    navigate(returnTo);
  };

  useEffect(() => {
    if (panelParam) {
      localStorage.setItem("dashboard.activePanel", panelParam);
    }
  }, [panelParam]);
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
          {isAdmin && (
            <button className="side-link" onClick={() => navigate("/admin")}>
              <SidebarIcon name="create" />
              NEW USERS
            </button>
          )}
          <button
            className={`side-link ${reviewerPanel === "inbox" ? "active" : ""}`}
            onClick={() => setReviewerPanel("inbox")}
          >
            <SidebarIcon name="inbox" />
            INBOX
          </button>
          <button
            className={`side-link ${
              reviewerPanel === "in_progress" ? "active" : ""
            }`}
            onClick={() => setReviewerPanel("in_progress")}
          >
            <SidebarIcon name="progress" />
            ON PROGRESS
          </button>
          <button
            className={`side-link ${reviewerPanel === "approved" ? "active" : ""}`}
            onClick={() => setReviewerPanel("approved")}
          >
            <SidebarIcon name="approved" />
            APPROVED
          </button>
          <button
            className={`side-link ${reviewerPanel === "rejected" ? "active" : ""}`}
            onClick={() => setReviewerPanel("rejected")}
          >
            <SidebarIcon name="rejected" />
            REJECTED
          </button>
          {isAdmin && (
            <>
              <button
                className="side-link"
                onClick={() => navigate("/admin/filter")}
              >
                <SidebarIcon name="users" />
                USERS
              </button>
              <button
                className="side-link"
                onClick={() => navigate("/admin/notice")}
              >
                <SidebarIcon name="pdf" />
                CHANGE PDF
              </button>
              {isMasterAdmin && (
                <button
                  className="side-link"
                  onClick={() => navigate("/admin/schools")}
                >
                  <SidebarIcon name="schools" />
                  CHANGE SCHOOLS
                </button>
              )}
            </>
          )}
        </nav>
      </aside>
      <main className="dashboard-main">
        <div className="page-header">
          <h2>Review Detail</h2>
          <button
            className="ghost-btn"
            onClick={() => navigate(returnTo)}
          >
            Back to List
          </button>
        </div>
        {!selectedDetail ? (
          <div className="card muted">Loading application details...</div>
        ) : (
          <>
            <div className="queue-detail">
              <h3>
                {formatNameWithInitials(
                  selectedDetail.applicant_name || formA.applicant_full_name_caps
                ) || "Applicant"}
              </h3>
              <p>Status: {formatStatus(selectedDetail.status)}</p>
              <p>Current Location: {selectedDetail.current_stage}</p>
              <div className="card detail-card">
                <h4>Applicant Summary</h4>
                <p>
                  <strong>Applicant:</strong>{" "}
                  {formatNameWithInitials(formA.applicant_full_name_caps) || "-"}
                </p>
                <p>
                  <strong>Service No:</strong> {formA.service_number || "-"}
                </p>
                <p>
                  <strong>Unit:</strong> {formA.unit_name || "-"}
                </p>
                <p>
                  <strong>Child:</strong> {formA.child_full_name_caps || "-"}
                </p>
                <p>
                  <strong>DOB:</strong> {formA.child_dob || "-"}
                </p>
                <p>
                  <strong>Gender:</strong> {formA.child_gender || "-"}
                </p>
                <div className="detail-list">
                  <strong>School Preferences:</strong>
                  <ol>
                    {(formA.schools || [])
                      .filter((s) => s.census_no)
                      .map((s) => (
                        <li key={`${s.census_no}-${s.name}`}>
                          {s.census_no} - {s.name}
                        </li>
                      ))}
                  </ol>
                </div>
              </div>
              <div className="card detail-card">
                <h4>Attachments</h4>
                {attachments.length === 0 ? (
                  <p className="muted">No attachments.</p>
                ) : (
                  <ul className="attachment-list">
                    {attachments.map((file) => (
                      <li key={file.id}>
                        <a
                          href={`${API_BASE}${file.path}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.filename}
                        </a>
                        <span className="muted"> ({file.type})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="card detail-card">
                <h4>Approval History</h4>
                {steps.length === 0 ? (
                  <p className="muted">No history yet.</p>
                ) : (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Level</th>
                        <th>Action</th>
                        <th>Date</th>
                        <th>Time</th>
                        <th>Remark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {steps.map((step) => {
                        const dt = new Date(step.created_at);
                        return (
                          <tr key={step.id}>
                            <td>{displayLevel(step)}</td>
                            <td>{step.action}</td>
                            <td>{dt.toLocaleDateString()}</td>
                            <td>{dt.toLocaleTimeString()}</td>
                            <td>{formatStampComment(step.comment) || "-"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <label>
                Remarks
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </label>
              <div className="form-actions">
                <button className="ghost-btn" onClick={downloadPdf}>
                  Download PDF
                </button>
                <button className="ghost-btn" onClick={viewPdf}>
                  View PDF
                </button>
                {previewUrl && (
                  <button className="ghost-btn" onClick={closePreview}>
                    Close Preview
                  </button>
                )}
                <button className="danger-btn" onClick={deleteApplication}>
                  Delete Application
                </button>
                {allowedActions.includes("return") && (
                  <button
                    className="ghost-btn"
                    onClick={() => takeAction("return")}
                  >
                    Return
                  </button>
                )}
                {allowedActions.includes("forward") && (
                  <button
                    className="primary-btn"
                    onClick={() => takeAction("forward")}
                  >
                    Forward
                  </button>
                )}
                {allowedActions.includes("approve") && (
                  <button
                    className="primary-btn"
                    onClick={() => takeAction("approve")}
                  >
                    Approve
                  </button>
                )}
                {allowedActions.includes("recommend") && (
                  <button
                    className="primary-btn"
                    onClick={() => takeAction("recommend")}
                  >
                    Recommend
                  </button>
                )}
                {allowedActions.includes("reject") && (
                  <button
                    className="danger-btn"
                    onClick={() => takeAction("reject")}
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
            {previewUrl && (
              <div className="pdf-preview" ref={previewRef}>
                <div className="pdf-preview-header">
                  <h4>Application PDF Preview</h4>
                  <button className="ghost-btn" onClick={closePreview}>
                    Close
                  </button>
                </div>
                <iframe title="Application PDF" src={previewUrl} />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
