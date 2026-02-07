import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import {
  deleteAdminUser,
  getAdminUserByServiceNo,
  getAdminUsers,
  updateAdminUser
} from "../api.js";
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
  "DteWelfareGSO2",
  "RHQAdmin",
  "Admin"
];

export default function AdminFilter() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [status, setStatus] = useState("");
  const [filterRegiment, setFilterRegiment] = useState("");
  const [filterUnitNo, setFilterUnitNo] = useState("");
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
        if (role === "DteWelfareClerk" || role === "DteWelfareGSO2") return false;
        if (isRhqAdmin) return rhqRoles.has(role);
        return unitRoles.has(role);
      });
  const autoFillDoneRef = useRef(false);

  const loadData = () => {
    getAdminUsers().then((userRes) => {
      setUsers(userRes.data || []);
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!isMasterAdmin || autoFillDoneRef.current) return;
    if (users.length === 0) return;
    autoFillDoneRef.current = true;
    const missing = users.filter(
      (item) => !item.regiment || !item.unit_no
    );
    if (missing.length === 0) return;
    (async () => {
      for (const item of missing) {
        const serviceNo = String(item.service_no || "").trim();
        if (!serviceNo || serviceNo.includes("@")) continue;
        try {
          const res = await getAdminUserByServiceNo(serviceNo);
          const data = res.data || {};
          if (!data.regiment && !data.unit_no) continue;
          await updateAdminUser(item.id, {
            regiment: data.regiment || item.regiment || null,
            unit_no: data.unit_no || item.unit_no || null
          });
        } catch {
          // Ignore lookup errors for now.
        }
      }
      loadData();
    })();
  }, [isMasterAdmin, users]);

  const startEdit = (item) => {
    setEditUser({
      id: item.id,
      name: item.name,
      roles: item.roles,
      regiment: item.regiment || "",
      unit_no: item.unit_no || ""
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editUser) return;
    setStatus("");
    await updateAdminUser(editUser.id, {
      name: editUser.name,
      roles: editUser.roles,
      regiment: editUser.regiment || null,
      unit_no: editUser.unit_no || null
    });
    setEditUser(null);
    setStatus("User updated.");
    loadData();
  };

  const handleDelete = async (item) => {
    const confirmed = window.confirm(
      `Delete ${item.name} (${item.service_no})?`
    );
    if (!confirmed) return;
    setStatus("");
    try {
      await deleteAdminUser(item.id);
      setStatus("User deleted.");
      loadData();
    } catch (err) {
      const message =
        err.response?.data?.error || "Delete failed. Try again.";
      setStatus(message);
    }
  };

  const toggleActive = async (item) => {
    const nextActive = item.active ? 0 : 1;
    const label = nextActive ? "activate" : "deactivate";
    const confirmed = window.confirm(
      `Are you sure you want to ${label} ${item.name} (${item.service_no})?`
    );
    if (!confirmed) return;
    setStatus("");
    try {
      await updateAdminUser(item.id, { active: nextActive });
      setStatus(nextActive ? "User activated." : "User deactivated.");
      loadData();
    } catch (err) {
      const message =
        err.response?.data?.error || "Update failed. Try again.";
      setStatus(message);
    }
  };

  const openReviewPanel = (panel) => {
    setReviewerPanel(panel);
    setShowReviewer(true);
    navigate(`/admin/filter?queue=1&panel=${panel}`, { replace: true });
  };

  const filteredUsers = users.filter((item) => {
    if (!isMasterAdmin) {
      if (String(item.service_no || "").toLowerCase() === "kavindu@gmail.com") {
        return false;
      }
    }
    if (filterRegiment && item.regiment !== filterRegiment) return false;
    if (filterUnitNo && item.unit_no !== filterUnitNo) return false;
    return true;
  });

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
          className={`side-link ${showReviewer ? "" : "active"}`}
          onClick={() => {
            setShowReviewer(false);
            navigate("/admin/filter");
          }}
        >
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
            returnTo={`/admin/filter?queue=1&panel=${reviewerPanel}`}
          />
        ) : (
          <>
            <div className="page-header">
              <h2>Filter Users</h2>
            </div>
            {status && <div className="notice">{status}</div>}
            <div className="card">
              <h3>Filter Users</h3>
              <div className="form-grid">
                <label>
                  Regiment
                  <input
                    value={filterRegiment}
                    onChange={(e) => setFilterRegiment(e.target.value)}
                    placeholder="All regiments"
                  />
                </label>
                <label>
                  Unit No
                  <input
                    value={filterUnitNo}
                    onChange={(e) => setFilterUnitNo(e.target.value)}
                    placeholder="All unit numbers"
                  />
                </label>
              </div>
            </div>
            {editUser && (
              <div className="card">
                <h3>Edit User</h3>
                <form className="form-grid" onSubmit={handleUpdate}>
                  <label>
                    Name
                    <input
                      value={editUser.name}
                      onChange={(e) =>
                        setEditUser({ ...editUser, name: e.target.value })
                      }
                      required
                    />
                  </label>
                  <label>
                    Roles
                    <select
                      value={editUser.roles}
                      onChange={(e) =>
                        setEditUser({ ...editUser, roles: e.target.value })
                      }
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
                      value={editUser.regiment || ""}
                      onChange={(e) =>
                        setEditUser({ ...editUser, regiment: e.target.value })
                      }
                    />
                  </label>
                <label>
                  Unit No
                  <input
                    value={editUser.unit_no || ""}
                    onChange={(e) =>
                      setEditUser({ ...editUser, unit_no: e.target.value })
                    }
                  />
                </label>
                <div className="form-actions">
                    <button className="primary-btn" type="submit">
                      Update User
                    </button>
                    <button
                      className="ghost-btn"
                      type="button"
                      onClick={() => setEditUser(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
            <div className="card">
              <h3>Users</h3>
              <div className="table-scroll">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Service No</th>
                      <th>Name</th>
                      <th>Roles</th>
                      <th>Regiment</th>
                      <th>Unit No</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((item) => (
                      <tr key={item.id}>
                        <td>{item.service_no}</td>
                        <td>{formatNameWithInitials(item.name)}</td>
                        <td>{item.roles}</td>
                        <td>{item.regiment || "-"}</td>
                        <td>{item.unit_no || "-"}</td>
                        <td>{item.active ? "Active" : "Inactive"}</td>
                        <td className="action-group">
                          <button
                            type="button"
                            className="ghost-btn"
                            onClick={() => startEdit(item)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className={item.active ? "danger-btn" : "primary-btn"}
                            onClick={() => toggleActive(item)}
                          >
                            {item.active ? "Deactivate" : "Activate"}
                          </button>
                          {isMasterAdmin && (
                            <button
                              type="button"
                              className="danger-btn"
                              onClick={() => handleDelete(item)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan="7" className="muted">
                          No users found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
