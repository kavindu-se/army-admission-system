import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import { createAdminUser, getAdminUserByServiceNo } from "../api.js";
import crest from "../assets/Sri_Lanka_Army_Logo.png";
import { formatNameWithInitials } from "../utils/name.js";
import ReviewerQueueTable from "../components/ReviewerQueueTable.jsx";
import SidebarIcon from "../components/SidebarIcon.jsx";

const ROLE_OPTIONS = [
  "Applicant",
  "UnitSubjectClerk",
  "UnitAdjutant",
  "UnitCO",
  "RHQSubjectClerk",
  "RHQGSO",
  "CentreCommandant",
  "DteWelfareClerk",
  "DteWelfareDirector",
  "DteWelfareGSO2",
  "RHQAdmin",
  "Admin"
];

const emptyForm = {
  service_no: "",
  name: "",
  roles: "UnitSubjectClerk",
  regiment: "",
  unit_no: ""
};

export default function AdminUsers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState("");
  const [lookupStatus, setLookupStatus] = useState("");
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
  const unitRoles = new Set([
    "UnitSubjectClerk",
    "UnitAdjutant",
    "UnitCO"
  ]);
  const rhqRoles = new Set([
    "RHQSubjectClerk",
    "RHQGSO",
    "CentreCommandant"
  ]);
  const roleOptions = isMasterAdmin
    ? ROLE_OPTIONS
    : ROLE_OPTIONS.filter((role) => {
        if (role === "Admin" || role === "RHQAdmin") return false;
        if (
          role === "DteWelfareClerk" ||
          role === "DteWelfareDirector" ||
          role === "DteWelfareGSO2"
        )
          return false;
        if (isRhqAdmin) return rhqRoles.has(role);
        return unitRoles.has(role);
      });
  useEffect(() => {
    if (!roleOptions.includes(form.roles)) {
      setForm((prev) => ({
        ...prev,
        roles: roleOptions[0] || "UnitSubjectClerk"
      }));
    }
  }, [roleOptions, form.roles]);
  const handleCreate = async (e) => {
    e.preventDefault();
    setStatus("");
    await createAdminUser({
      ...form,
      regiment: form.regiment || null,
      unit_no: form.unit_no || null
    });
    setForm(emptyForm);
    setStatus("Role assigned.");
  };

  const handleLookup = async () => {
    const serviceNo = form.service_no.trim();
    if (!serviceNo) {
      setLookupStatus("Enter e-No first.");
      return;
    }
    setLookupStatus("");
    try {
      const res = await getAdminUserByServiceNo(serviceNo);
      const data = res.data || {};
      setForm((prev) => ({
        ...prev,
        name: data.name || prev.name,
        regiment: data.regiment || prev.regiment,
        unit_no: data.unit_no || prev.unit_no
      }));
      setLookupStatus("User loaded.");
    } catch (err) {
      setLookupStatus(err.response?.data?.error || "Lookup failed.");
    }
  };

  const openReviewPanel = (panel) => {
    setReviewerPanel(panel);
    setShowReviewer(true);
    navigate(`/admin?queue=1&panel=${panel}`, { replace: true });
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
            className={`side-link ${showReviewer ? "" : "active"}`}
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
          <button className="side-link" onClick={() => navigate("/admin/filter")}>
            <SidebarIcon name="users" />
            USERS
          </button>
          <button className="side-link" onClick={() => navigate("/admin/notice")}>
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
            returnTo={`/admin?queue=1&panel=${reviewerPanel}`}
          />
        ) : (
          <>
            <div className="page-header">
              <h2>Create New Users</h2>
            </div>
            {status && <div className="notice">{status}</div>}
            <div className="card" id="admin-assign-roles">
              <h3>New Users</h3>
              <form className="form-grid" onSubmit={handleCreate}>
                <label>
                  e-No
                  <div className="input-row">
                    <input
                      value={form.service_no}
                      onChange={(e) =>
                        setForm({ ...form, service_no: e.target.value })
                      }
                      required
                    />
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={handleLookup}
                    >
                      Search
                    </button>
                  </div>
                </label>
                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Role
                  <select
                    value={form.roles}
                    onChange={(e) => setForm({ ...form, roles: e.target.value })}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Regiment
                  <input
                    value={form.regiment}
                    onChange={(e) =>
                      setForm({ ...form, regiment: e.target.value })
                    }
                  />
                </label>
                <label>
                  Unit No
                  <input
                    value={form.unit_no}
                    onChange={(e) =>
                      setForm({ ...form, unit_no: e.target.value })
                    }
                  />
                </label>
                <div className="form-actions">
                  <button className="primary-btn" type="submit">
                    Assign Role
                  </button>
                </div>
                {lookupStatus && <div className="muted">{lookupStatus}</div>}
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
