import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../state/auth.jsx";
import {
  API_BASE,
  downloadNoticePdf as apiDownloadNoticePdf,
  downloadPdf as apiDownloadPdf,
  deleteApplication as apiDeleteApplication,
  getAttachments,
  getApplications,
  getMyActions
} from "../api.js";
import crest from "../assets/Sri_Lanka_Army_Logo.png";
import { formatNameWithInitials } from "../utils/name.js";
import SidebarIcon from "../components/SidebarIcon.jsx";

export default function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [historyApps, setHistoryApps] = useState([]);
  const [attachmentsByApp, setAttachmentsByApp] = useState({});
  const [attachmentsLoading, setAttachmentsLoading] = useState({});
  const [expandedAppId, setExpandedAppId] = useState(null);
  const [activePanel, setActivePanel] = useState(
    () => localStorage.getItem("dashboard.activePanel") || "notices"
  );
  const [noticeLang, setNoticeLang] = useState(
    () => localStorage.getItem("dashboard.noticeLang") || "si"
  );

  const formatStatus = (status) => {
    if (!status) return "-";
    return status.replace(/_/g, " ").toUpperCase();
  };

  const parseFormA = (value) => {
    if (!value) return null;
    if (typeof value === "object") return value;
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  };

  const resolveApplicantName = (app) => {
    const formA = parseFormA(app?.form_a_json);
    return (
      app?.applicant_name ||
      formA?.applicant_name_initials ||
      formA?.applicant_full_name_caps ||
      ""
    );
  };

  const loadApplications = () => {
    if (!token) return;
    getApplications()
      .then((res) => {
        const data = res.data || [];
        setApps(data);
      })
      .catch(() => {
        setApps([]);
      });
  };

  useEffect(() => {
    loadApplications();
    if (user && !user?.roles?.includes("Applicant")) {
      getMyActions().then((res) => setHistoryApps(res.data));
    }
  }, [token, user]);

  useEffect(() => {
    localStorage.setItem("dashboard.activePanel", activePanel);
  }, [activePanel]);

  useEffect(() => {
    localStorage.setItem("dashboard.noticeLang", noticeLang);
  }, [noticeLang]);

  const downloadPdf = async (app) => {
    const res = await apiDownloadPdf(app.id);
    const blobUrl = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `${app.application_no}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const downloadNoticePdf = async () => {
    const res = await apiDownloadNoticePdf();
    const blobUrl = window.URL.createObjectURL(res.data);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = "notice.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const viewPdf = async (app) => {
    const res = await apiDownloadPdf(app.id);
    const blobUrl = window.URL.createObjectURL(res.data);
    window.open(blobUrl, "_blank", "noopener,noreferrer");
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 30000);
  };

  const deleteApplication = async (app) => {
    const ok = window.confirm(
      "Delete this application? This cannot be undone."
    );
    if (!ok) return;
    try {
      await apiDeleteApplication(app.id);
      setApps((prev) => prev.filter((item) => item.id !== app.id));
      setAttachmentsByApp((prev) => {
        const next = { ...prev };
        delete next[app.id];
        return next;
      });
      if (expandedAppId === app.id) {
        setExpandedAppId(null);
      }
    } catch (err) {
      if (err?.response?.status === 403) {
        window.alert(
          "This application can no longer be deleted because it has moved to the next stage."
        );
      } else {
        window.alert("Failed to delete the application. Please try again.");
      }
      loadApplications();
    }
  };

  const fetchAttachments = (appId) => {
    if (!appId || attachmentsByApp[appId] || attachmentsLoading[appId]) return;
    setAttachmentsLoading((prev) => ({ ...prev, [appId]: true }));
    getAttachments(appId)
      .then((res) => {
        setAttachmentsByApp((prev) => ({
          ...prev,
          [appId]: res.data || []
        }));
      })
      .catch(() => {
        setAttachmentsByApp((prev) => ({
          ...prev,
          [appId]: []
        }));
      })
      .finally(() => {
        setAttachmentsLoading((prev) => ({ ...prev, [appId]: false }));
      });
  };

  const toggleAttachments = (appId) => {
    if (expandedAppId === appId) {
      setExpandedAppId(null);
      return;
    }
    setExpandedAppId(appId);
    fetchAttachments(appId);
  };

  const isApplicant = user?.roles?.includes("Applicant");
  const isMasterAdmin =
    String(user?.service_no || "").toLowerCase() === "kavindu@gmail.com";
  const isAdmin =
    user?.roles?.includes("Admin") || user?.roles?.includes("RHQAdmin");
  const reviewerPanels = ["inbox", "in_progress", "approved", "rejected"];
  const roleLabel = (() => {
    const roles = user?.roles || [];
    if (isMasterAdmin && roles.includes("Admin")) return "Super Admin";
    if (roles.includes("RHQAdmin")) return "RHQ Admin";
    if (roles.includes("Admin")) return "Unit Admin";
    if (roles.includes("Applicant")) return "Applicant";
    if (roles.length > 0) return roles[0];
    return "Reviewer";
  })();
  const displayName = formatNameWithInitials(user?.name || "");

  useEffect(() => {
    if (!user) return;
    if (isApplicant && reviewerPanels.includes(activePanel)) {
      setActivePanel("notices");
    }
    if (!isApplicant && ["applications", "notices"].includes(activePanel)) {
      setActivePanel("inbox");
    }
  }, [user, isApplicant, activePanel]);

  const reviewerData = (() => {
    const approved = historyApps.filter((app) => app.status === "dte_approved");
    const rejected = historyApps.filter((app) => app.status === "rejected");
    const inProgress = historyApps.filter(
      (app) => app.status !== "dte_approved" && app.status !== "rejected"
    );
    return {
      inbox: apps,
      in_progress: inProgress,
      approved,
      rejected
    };
  })();

  const reviewerList = reviewerData[activePanel] || [];
  const reviewerCounts = {
    inbox: reviewerData.inbox.length,
    in_progress: reviewerData.in_progress.length,
    approved: reviewerData.approved.length,
    rejected: reviewerData.rejected.length
  };

  return (
    <div className="page dashboard-shell">
      <aside className="dashboard-sidebar">
        <div className="profile-card">
          <img className="profile-avatar" src={crest} alt="Applicant Photo" />
          <div>
            <div className="profile-name">{displayName || "Applicant"}</div>
            <div className="profile-role">
              {roleLabel}
            </div>
            {(user?.regiment || user?.unit_no) && (
              <div className="profile-meta muted">
                {[user?.regiment, user?.unit_no].filter(Boolean).join(" • ")}
              </div>
            )}
          </div>
        </div>
        {isApplicant && (
          <button className="primary-btn full-btn" onClick={() => navigate("/apply")}>
            New Application
          </button>
        )}
        <nav className="side-menu">
          {isApplicant && (
            <button
              className={`side-link ${activePanel === "applications" ? "active" : ""}`}
              onClick={() => setActivePanel("applications")}
            >
              <SidebarIcon name="applications" />
              My Applications
            </button>
          )}
          {isAdmin && (
            <button className="side-link" onClick={() => navigate("/admin")}>
              <SidebarIcon name="dashboard" />
              {isMasterAdmin
                ? "Admin Panel"
                : user?.roles?.includes("RHQAdmin")
                  ? "RHQ Admin Panel"
                  : "Unit Admin Panel"}
            </button>
          )}
          {!isApplicant && (
            <>
              <button
                className={`side-link ${activePanel === "inbox" ? "active" : ""}`}
                onClick={() => setActivePanel("inbox")}
              >
                <SidebarIcon name="inbox" />
                Inbox
              </button>
              <button
                className={`side-link ${activePanel === "in_progress" ? "active" : ""}`}
                onClick={() => setActivePanel("in_progress")}
              >
                <SidebarIcon name="progress" />
                On Progress
              </button>
              <button
                className={`side-link ${activePanel === "approved" ? "active" : ""}`}
                onClick={() => setActivePanel("approved")}
              >
                <SidebarIcon name="approved" />
                Approved
              </button>
              <button
                className={`side-link ${activePanel === "rejected" ? "active" : ""}`}
                onClick={() => setActivePanel("rejected")}
              >
                <SidebarIcon name="rejected" />
                Rejected
              </button>
            </>
          )}
          {isApplicant && (
            <button
              className={`side-link ${activePanel === "notices" ? "active" : ""}`}
              onClick={() => setActivePanel("notices")}
            >
              <SidebarIcon name="notice" />
              Notices
            </button>
          )}
        </nav>
      </aside>
      <main className="dashboard-main">
        <div className="page-header">
          <h2>Welcome, {displayName}</h2>
        </div>

        {activePanel === "applications" && isApplicant && (
          <div className="card-grid">
            {apps.map((app) => (
              <div className="card" key={app.id}>
                <h3>
                  {formatNameWithInitials(app.applicant_name) || "Applicant"}
                </h3>
                <p>Status: {formatStatus(app.status)}</p>
                <p>Stage: {app.current_stage}</p>
                {isApplicant && (
                  <div className="muted attachment-block">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => toggleAttachments(app.id)}
                    >
                      {expandedAppId === app.id ? "Hide attachments" : "Show attachments"}
                    </button>
                    {expandedAppId === app.id && (
                      <div>
                        {attachmentsLoading[app.id] && <div>Loading attachments...</div>}
                        {!attachmentsLoading[app.id] &&
                          (attachmentsByApp[app.id] || []).length === 0 && (
                            <div>No attachments.</div>
                          )}
                        {!attachmentsLoading[app.id] &&
                          (attachmentsByApp[app.id] || []).length > 0 && (
                            <ul className="attachment-list">
                              {(attachmentsByApp[app.id] || []).map((file) => (
                                <li key={file.id}>
                                  <a
                                    href={`${API_BASE}${file.path}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {file.filename}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                      </div>
                    )}
                  </div>
                )}
                {isApplicant && (
                  <div className="action-group">
                    <button className="ghost-btn" onClick={() => downloadPdf(app)}>
                      Download PDF
                    </button>
                    <button className="ghost-btn" onClick={() => viewPdf(app)}>
                      View PDF
                    </button>
                    {app.status === "draft" && (
                      <button
                        className="ghost-btn"
                        onClick={() => navigate(`/apply/${app.id}`)}
                      >
                        Continue Draft
                      </button>
                    )}
                    {(app.current_stage === "Applicant" ||
                      app.current_stage === "UnitSubjectClerk") && (
                      <button
                        className="danger-btn"
                        onClick={() => deleteApplication(app)}
                      >
                        Delete Application
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
            {apps.length === 0 && (
              <div className="card muted">No applications yet.</div>
            )}
          </div>
        )}
        {!isApplicant && reviewerPanels.includes(activePanel) && (
          <div className="card">
            <div className="page-header">
              <h3>Approval Queue</h3>
              <div className="tab-toggle">
                <button
                  type="button"
                  className={`tab-btn ${activePanel === "inbox" ? "active" : ""}`}
                  onClick={() => setActivePanel("inbox")}
                >
                  INBOX
                  <span className="tab-badge">{reviewerCounts.inbox}</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${
                    activePanel === "in_progress" ? "active" : ""
                  }`}
                  onClick={() => setActivePanel("in_progress")}
                >
                  ON PROGRESS
                  <span className="tab-badge">{reviewerCounts.in_progress}</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activePanel === "approved" ? "active" : ""}`}
                  onClick={() => setActivePanel("approved")}
                >
                  APPROVED
                  <span className="tab-badge">{reviewerCounts.approved}</span>
                </button>
                <button
                  type="button"
                  className={`tab-btn ${activePanel === "rejected" ? "active" : ""}`}
                  onClick={() => setActivePanel("rejected")}
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
                                `/review/${app.id}?panel=${activePanel}&return=/dashboard`
                              )
                            }
                          >
                            View
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
        )}
        {activePanel === "notices" && isApplicant && (
          <div className="card notice-panel">
            <div className="notice-header">
              <h3 className={noticeLang === "si" ? "notice-alert-title" : ""}>
                {noticeLang === "en"
                  ? "General Instructions for Submission of Applications"
                  : "අයදුම් කිරීම සම්බන්ධ සාමාන්‍ය උපදෙස්"}
              </h3>
              <div className="lang-toggle">
                <button
                  type="button"
                  className={`lang-btn ${noticeLang === "si" ? "active" : ""}`}
                  onClick={() => setNoticeLang("si")}
                >
                  සිං
                </button>
                <button
                  type="button"
                  className={`lang-btn ${noticeLang === "en" ? "active" : ""}`}
                  onClick={() => setNoticeLang("en")}
                >
                  EN
                </button>
              </div>
            </div>
            <div className="form-actions">
              <button
                className="ghost-btn notice-download-btn"
                onClick={downloadNoticePdf}
              >
                Download Notice PDF
              </button>
            </div>
            {noticeLang === "en" ? (
              <ol className="notice-alert-list">
                <li>Only one application form shall be completed for one child. The original application form and three (03) certified copies shall be submitted to the relevant Division/Zone, and one copy shall be retained by the applicant. A father or mother who served in active operational duty for a longer period of time.</li>
                <li>The application form must be submitted together with the child’s Birth Certificate. In addition, any other documents requested by the relevant Selection / Interview Board shall also be submitted.</li>
                <li>Applications may be submitted for a maximum of ten (10) schools, in accordance with the prescribed order of preference.</li>
                <li>The schools applied for must be Government schools or schools that conduct primary grades.</li>
                <li>Based on the minimum marks obtained for selection of students in the previous year, applicants are advised to select ten (10) schools with a reasonable possibility of admission.</li>
                <li>Colombo and Kurunegala Defence Services Colleges shall not be included among the ten (10) selected schools.</li>
                <li>When applying to schools selected on a religious basis, due consideration shall be given to the eligibility of the child for admission to the relevant school in accordance with the child’s religion.</li>
                <li>When submitting applications in respect of twin children, consideration shall be given to the possibility of admitting both children to the same school, depending on the number of vacancies available in that school.</li>
                <li>In the event of any discrepancy between the name of a school and its serial number, priority shall be given to the serial number assigned to the school.</li>
                <li>The provisional marks list shall be published in the month of July, and the provisional list of selected schools shall be published in the month of October, on the official website of the Ministry of Defence and other relevant official websites.</li>
                <li>If any applicant is not satisfied with the marks or the school allotted, based on the published provisional marks list or provisional school list, appeals may be submitted within the stipulated time period.</li>
              </ol>
            ) : (
              <ol className="notice-alert-list">
                <li>එක් දරුවෙකු සඳහා එක් අයදුම්පත්‍රයක් පමණක් සම්පූර්ණ කළ යුතුය. සම්පූර්ණ කරන ලද අයදුම්පත්‍රයේ මුල් පිටපත සහ සහතික පිටපත් 3ක් අදාළ කොට්ඨාසය වෙත භාරදිය යුතු අතර, එක් පිටපතක් තමන් ළඟ තබා ගත යුතුය. වැඩි කාලසීමාවක් ක්‍රියාන්විත සේවයේ යෙදී සිටි පියා හෝ මව.</li>
                <li>අයදුම්පත්‍රය සමඟ දරුවාගේ උප්පැන්න සහතිකය ඉදිරිපත් කළ යුතුය. ඊට අමතරව, අදාළ භූමිකාවට අදාළව අධ්‍යක්ෂ මණ්ඩලය විසින් ඉල්ලා සිටින අනෙකුත් ලියකියවිලිද ඉදිරිපත් කළ යුතුය.</li>
                <li>මෙම ක්‍රමවේදයට අනුව පාසල් 10ක් දක්වා අයදුම් කළ හැක.</li>
                <li>අයදුම් කරන පාසල් රජයේ පාසල් හෝ ප්‍රාථමික ශ්‍රේණි පවත්වාගෙන යන පාසල් විය යුතුය.</li>
                <li>පසුගිය වර්ෂයේ දරුවන් තෝරාගත් අඩුම ලකුණු ප්‍රමාණය අනුව සම්භාවිතාවක් ඇති පාසල් 10ක් තෝරා ගැනීම සුදුසු වේ.</li>
                <li>කොළඹ සහ කුරුණෑගල ආරක්ෂක සේවා විද්‍යාල මෙම පාසල් 10 තුළට ඇතුළත් නොකළ යුතුය.</li>
                <li>ආගමික පදනම මත පාසල් තෝරාගැනීමේදී, දරුවාගේ ආගම අනුව එම පාසලට ඇතුළත් වීමේ හැකියාව පිළිබඳ සලකා බැලිය යුතුය.</li>
                <li>නිවුන් දරුවන් සම්බන්ධ අයදුම්පත් ඉදිරිපත් කිරීමේදී, දරුවන් දෙදෙනාම එකම පාසලකට ඇතුළත් වීම සඳහා, එම පාසලේ පවතින පුර්වපාඩු සංඛ්‍යාව අනුව ඇතුළත් වීමේ හැකියාව සලකා බැලිය යුතුය.</li>
                <li>පාසලේ නම සහ අනුක්‍රමික අංකය අතර පරස්පරතාවයක් පවතින්නේ නම්, පාසලට හිමි අනුක්‍රමික අංකය අනුව ප්‍රමුඛතාවය ලබා දෙනු ලැබේ.</li>
                <li>තාවකාලික ලකුණු ලේඛනය ජූලි මාසය තුළද, තාවකාලික පාසල් ලේඛනය ඔක්තෝබර් මාසය තුළද, ආරක්ෂක අමාත්‍යාංශයේ නිල වෙබ් අඩවිය සහ අදාළ වෙබ් අඩවිවල ප්‍රසිද්ධ කරනු ලැබේ.</li>
                <li>ප්‍රසිද්ධ කරන ලද තාවකාලික ලකුණු ලේඛනය හෝ පාසල් ලේඛනය අනුව ලබා දී ඇති ලකුණු හෝ පාසල පිළිබඳ සෑහීමකට පත් නොවන්නේ නම්, අදාළ කාල සීමාව තුළ අභියාචනා ඉදිරිපත් කළ හැක.</li>
              </ol>
            )}
          </div>
        )}
      </main>
    </div>
  );
}


