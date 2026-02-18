import axios from "axios";

export const API_BASE = "http://localhost:4000";

const api = axios.create({
  baseURL: API_BASE
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function login(username, password) {
  return api.post("/auth/login", { e_no: username, password });
}

export function loginAdmin(email, password) {
  return api.post("/auth/admin/login", { email, password });
}

export function getMe() {
  return api.get("/me");
}

export function getApplications() {
  return api.get("/applications");
}

export function getMyActions() {
  return api.get("/applications/my-actions");
}

export function getApplication(id) {
  return api.get(`/applications/${id}`);
}

export function createOrUpdateApplication(payload) {
  return api.post("/applications", payload);
}

export function takeAction(id, action, comment) {
  return api.post(`/applications/${id}/action`, { action, comment });
}

export function getSteps(id) {
  return api.get(`/applications/${id}/steps`);
}

export function getSchools(medium) {
  const params = medium ? { medium } : undefined;
  return api.get("/schools", { params });
}

export function downloadPdf(id) {
  return api.get(`/applications/${id}/pdf`, { responseType: "blob" });
}

export function deleteApplication(id) {
  return api.delete(`/applications/${id}`);
}

export function uploadAttachment(id, file, type = "general") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  return api.post(`/applications/${id}/attachments`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

export function getAttachments(id) {
  return api.get(`/applications/${id}/attachments`);
}

export function getAdminUsers() {
  return api.get("/admin/users");
}

export function getAdminUserByServiceNo(serviceNo) {
  return api.get("/admin/users/lookup", { params: { service_no: serviceNo } });
}

export function createAdminUser(payload) {
  return api.post("/admin/users", payload);
}

export function updateAdminUser(id, payload) {
  return api.put(`/admin/users/${id}`, payload);
}

export function deleteAdminUser(id) {
  return api.delete(`/admin/users/${id}`);
}

export function getAdminUnits() {
  return api.get("/admin/units");
}

export function uploadSchoolsCsv(file) {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/admin/schools/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

export function uploadNoticePdf(file) {
  const formData = new FormData();
  formData.append("file", file);
  return api.post("/admin/notice-pdf/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
}

export function downloadNoticePdf() {
  return api.get("/notice-pdf", { responseType: "blob" });
}

export function downloadSchoolsTemplate() {
  return api.get("/admin/schools/template", { responseType: "blob" });
}

export default api;
