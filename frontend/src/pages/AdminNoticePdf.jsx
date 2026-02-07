import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import { downloadNoticePdf, uploadNoticePdf } from "../api.js";
import crest from "../assets/Sri_Lanka_Army_Logo.png";
import { formatNameWithInitials } from "../utils/name.js";
import ReviewerQueueTable from "../components/ReviewerQueueTable.jsx";
import SidebarIcon from "../components/SidebarIcon.jsx";

export default function AdminNoticePdf() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [showReviewer, setShowReviewer] = useState(false);
  const [reviewerPanel, setReviewerPanel] = useState("inbox");
  const isApplicant = user?.roles?.includes("Applicant");
  const isMasterAdmin =
    String(user?.service_no || "").toLowerCase() === "kavindu@gmail.com";
  const isRhqAdmin = user?.roles?.includes("RHQAdmin");
  const profileRole = isMasterAdmin
    ? "Super Admin"
    : isRhqAdmin
      ? "RHQ Admin"
      : "Unit Admin";
  const openReviewPanel = (panel) => {
    setReviewerPanel(panel);
    setShowReviewer(true);
    navigate(`/admin/notice?queue=1&panel=${panel}`, { replace: true });
  };

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queue = params.get("queue");
    const panel = params.get("panel");
    if (queue === "1") {
      setShowReviewer(true);
      if (panel) setReviewerPanel(panel);
    }
  }, [location.search]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setStatus("Select a PDF file.");
      return;
    }
    setStatus("");
    try {
      await uploadNoticePdf(file);
      setStatus("Notice PDF updated.");
      setFile(null);
    } catch (err) {
      const message =
        err.response?.data?.error || "Upload failed. Try again.";
      setStatus(message);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await downloadNoticePdf();
      const blobUrl = window.URL.createObjectURL(res.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "notice.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      const message =
        err.response?.data?.error || "Download failed. Try again.";
      setStatus(message);
    }
  };

  return (
    <div className="page dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="profile-card">
          <img className="profile-avatar" src={crest} alt="Admin Avatar" />
          <div>
            <div className="profile-name">
              {formatNameWithInitials(user?.name) || "Admin"}
            </div>
            <div className="profile-role">{profileRole}</div>
          </div>
        </div>
        <nav className="side-menu">
          <button
            className="side-link"
            onClick={() => {
              setShowReviewer(false);
              navigate("/admin");
            }}
          >
            <SidebarIcon name="create" />
            NEW USERS
          </button>
          {!isApplicant && (
            <>
              <button
                className={`side-link ${showReviewer && reviewerPanel === "inbox" ? "active" : ""}`}
                onClick={() => openReviewPanel("inbox")}
              >
                <SidebarIcon name="inbox" />
                INBOX
              </button>
              <button
                className={`side-link ${showReviewer && reviewerPanel === "in_progress" ? "active" : ""}`}
                onClick={() => openReviewPanel("in_progress")}
              >
                <SidebarIcon name="progress" />
                ON PROGRESS
              </button>
              <button
                className={`side-link ${showReviewer && reviewerPanel === "approved" ? "active" : ""}`}
                onClick={() => openReviewPanel("approved")}
              >
                <SidebarIcon name="approved" />
                APPROVED
              </button>
              <button
                className={`side-link ${showReviewer && reviewerPanel === "rejected" ? "active" : ""}`}
                onClick={() => openReviewPanel("rejected")}
              >
                <SidebarIcon name="rejected" />
                REJECTED
              </button>
            </>
          )}
          <button
            className="side-link"
            onClick={() => {
              setShowReviewer(false);
              navigate("/admin/filter");
            }}
          >
            <SidebarIcon name="users" />
            USERS
          </button>
          <button
            className={`side-link ${showReviewer ? "" : "active"}`}
            onClick={() => {
              setShowReviewer(false);
              navigate("/admin/notice");
            }}
          >
            <SidebarIcon name="pdf" />
            CHANGE PDF
          </button>
          <button
            className="side-link"
            onClick={() => navigate("/admin/schools")}
          >
            <SidebarIcon name="schools" />
            CHANGE SCHOOLS
          </button>
        </nav>
      </aside>
      <main className="dashboard-main">
        {showReviewer ? (
          <ReviewerQueueTable
            activePanel={reviewerPanel}
            onChangePanel={setReviewerPanel}
            returnTo={`/admin/notice?queue=1&panel=${reviewerPanel}`}
          />
        ) : (
          <>
            <div className="page-header">
              <h2>Notice PDF</h2>
            </div>
            {status && <div className="notice">{status}</div>}
            <div className="card">
              <h3>Update Notice PDF</h3>
              <form className="form-grid" onSubmit={handleUpload}>
                <label>
                  PDF File
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                  />
                </label>
                <div className="form-actions">
                  <button className="primary-btn" type="submit">
                    Upload
                  </button>
                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={handleDownload}
                  >
                    Download Current PDF
                  </button>
                </div>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
