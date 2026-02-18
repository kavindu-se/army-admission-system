import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import multer from "multer";

dotenv.config();

process.on("unhandledRejection", (err) => {
  console.error("Unhandled rejection:", err);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
});

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const EXTERNAL_AUTH_URL = process.env.EXTERNAL_AUTH_URL;
const EXTERNAL_AUTH_ENABLED = process.env.EXTERNAL_AUTH_ENABLED === "true";
const EPORTAL_API_KEY =
  process.env.EPORTAL_API_KEY || "4461696c796d61696c4032303233";
const EPORTAL_LOOKUP_PASSWORD = process.env.EPORTAL_LOOKUP_PASSWORD || "";
const STR_API_TOKEN = process.env.STR_API_TOKEN || "";
const STR_EST_API_TOKEN = process.env.STR_EST_API_TOKEN || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NAME = process.env.ADMIN_NAME || "System Admin";

const establishmentsCache = {
  items: [],
  fetchedAt: 0
};

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const noticeCandidates = [
  path.join(process.cwd(), "notice_2026.pdf"),
  path.join(process.cwd(), "data", "notice_2026.pdf"),
  path.join(process.cwd(), "..", "notice_2026.pdf"),
  path.join(uploadDir, "notice_2026.pdf")
];
const NOTICE_PDF_PATH =
  noticeCandidates.find((candidate) => fs.existsSync(candidate)) ||
  path.join(uploadDir, "notice_2026.pdf");

app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".bin";
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_");
    const name = `${req.params.id}_${Date.now()}_${safeBase}${ext}`;
    cb(null, name);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const ROLE = {
  APPLICANT: "Applicant",
  UNIT_CLERK: "UnitSubjectClerk",
  UNIT_ADJUTANT: "UnitAdjutant",
  UNIT_CO: "UnitCO",
  RHQ_CLERK: "RHQSubjectClerk",
  RHQ_GSO: "RHQGSO",
  CENTRE_COMMANDANT: "CentreCommandant",
  GSO1: "GSO1",
  DTE_WELFARE: "DteWelfareClerk",
  DTE_DIRECTOR: "DteWelfareDirector",
  DTE_GSO2: "DteWelfareGSO2",
  RHQ_ADMIN: "RHQAdmin",
  ADMIN: "Admin"
};

const STAGE = {
  APPLICANT: "Applicant",
  UNIT_CLERK: "UnitSubjectClerk",
  UNIT_ADJUTANT: "UnitAdjutant",
  UNIT_CO: "UnitCO",
  RHQ_CLERK: "RHQSubjectClerk",
  COMMAND_APPROVALS: "CommandApprovals",
  GSO1: "GSO1",
  CENTRE_COMMANDANT: "CentreCommandant",
  DTE: "DteWelfareClerk",
  DTE_GSO2: "DteWelfareGSO2",
  CLOSED: "Closed"
};

const STATUS = {
  DRAFT: "draft",
  SUBMITTED: "submitted_to_unit",
  UNIT_ENDORSED: "unit_endorsed",
  RHQ_APPROVED: "rhq_approved",
  DTE_APPROVED: "dte_approved",
  RETURNED: "returned",
  REJECTED: "rejected"
};

function encodeToken(user) {
  const payload = {
    id: user.id,
    roles: user.roles.split(","),
    unit_id: user.unit_id,
    rhq_id: user.rhq_id,
    unit_no: user.unit_no,
    regiment: user.regiment,
    name: user.name,
    service_no: user.service_no,
    active: user.active
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64");
}

function decodeToken(token) {
  try {
    const json = Buffer.from(token, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

async function fetchStrPerson(eNo) {
  if (!STR_API_TOKEN || !eNo) return null;
  try {
    const url = new URL("https://str.army.lk/api/get_person/");
    url.searchParams.set("str-token", STR_API_TOKEN);
    url.searchParams.set("e_no", String(eNo));
    const response = await fetch(url.toString());
    const data = await response.json();
    const person =
      (Array.isArray(data) ? data[0] : null) ||
      data?.person?.[0] ||
      data?.data?.person?.[0];
    if (!response.ok || !person) return null;
    return person;
  } catch {
    return null;
  }
}

async function fetchEstablishments() {
  if (!STR_EST_API_TOKEN) return [];
  const now = Date.now();
  if (establishmentsCache.items.length > 0 && now - establishmentsCache.fetchedAt < 60 * 60 * 1000) {
    return establishmentsCache.items;
  }
  try {
    const url = new URL("https://str.army.lk/api/get_all_est_of_system/");
    url.searchParams.set("str-token", STR_EST_API_TOKEN);
    const response = await fetch(url.toString());
    const data = await response.json();
    const list = Array.isArray(data) ? data : data?.data || [];
    const items = list
      .map((row) => row?.abb_name)
      .filter(Boolean)
      .map((name) => name.trim())
      .filter(Boolean);
    const unique = Array.from(new Set(items)).sort((a, b) =>
      a.localeCompare(b)
    );
    establishmentsCache.items = unique;
    establishmentsCache.fetchedAt = now;
    return unique;
  } catch {
    return establishmentsCache.items;
  }
}

async function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing token" });
  }
  const user = decodeToken(token);
  if (user) {
    const [rows] = await pool.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [user.id]
    );
    const dbUser = rows[0];
    if (!dbUser || dbUser.active === 0) {
      return res.status(403).json({ error: "User inactive" });
    }
    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      service_no: dbUser.service_no,
      roles: dbUser.roles.split(","),
      unit_id: dbUser.unit_id,
      rhq_id: dbUser.rhq_id,
      unit_no: dbUser.unit_no,
      regiment: dbUser.regiment,
      active: dbUser.active
    };
    return next();
  }

  const payload = decodeJwtPayload(token);
  if (!payload?.eno) {
    return res.status(401).json({ error: "Invalid token" });
  }

  const serviceNo = payload.eno.toString();
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE service_no = ? LIMIT 1",
    [serviceNo]
  );
  let dbUser = rows[0];
  if (!dbUser) {
    const [result] = await pool.query(
      "INSERT INTO users (service_no, name, roles, unit_id, rhq_id) VALUES (?, ?, ?, ?, ?)",
      [serviceNo, payload.name || "Applicant", ROLE.APPLICANT, 1, 1]
    );
    const [created] = await pool.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [result.insertId]
    );
    dbUser = created[0];
  }

  req.user = {
    id: dbUser.id,
    name: dbUser.name,
    service_no: dbUser.service_no,
    roles: dbUser.roles.split(","),
    unit_id: dbUser.unit_id,
    rhq_id: dbUser.rhq_id,
    unit_no: dbUser.unit_no,
    regiment: dbUser.regiment,
    active: dbUser.active
  };
  return next();
}

function hasRole(user, role) {
  return user.roles && user.roles.includes(role);
}

function isMasterAdmin(user) {
  if (!ADMIN_EMAIL) return false;
  return (
    String(user?.service_no || "").toLowerCase() ===
    ADMIN_EMAIL.toLowerCase()
  );
}

function requireAdmin(req, res, next) {
  if (!hasRole(req.user, ROLE.ADMIN) && !hasRole(req.user, ROLE.RHQ_ADMIN)) {
    return res.status(403).json({ error: "Admin access required" });
  }
  return next();
}

function canAssignRhqRoles(user) {
  return isMasterAdmin(user) || hasRole(user, ROLE.RHQ_ADMIN);
}

function includesAnyRole(roles, targets) {
  return roles.some((role) => targets.includes(role));
}

function getAssignableRoles(user) {
  if (isMasterAdmin(user)) {
    return new Set(Object.values(ROLE));
  }
  if (hasRole(user, ROLE.RHQ_ADMIN)) {
    return new Set([ROLE.RHQ_CLERK, ROLE.RHQ_GSO, ROLE.CENTRE_COMMANDANT]);
  }
  return new Set([
    ROLE.UNIT_CLERK,
    ROLE.UNIT_ADJUTANT,
    ROLE.UNIT_CO
  ]);
}

function matchesAdminScope(admin, target) {
  const regimentOk = !admin.regiment || admin.regiment === target.regiment;
  if (hasRole(admin, ROLE.RHQ_ADMIN)) {
    return regimentOk;
  }
  const adminUnit = normalizeUnitNo(admin.unit_no);
  const targetUnit = normalizeUnitNo(target.unit_no);
  const unitNoOk = !adminUnit || adminUnit === targetUnit;
  return regimentOk && unitNoOk;
}

function normalizeUnitNo(value) {
  if (!value) return "";
  return String(value)
    .replace(/\s*\(.*?\)\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function resolveEffectiveUnitNo(user) {
  return normalizeUnitNo(user?.unit_no);
}


function resolveStrRegiment(person) {
  if (!person) return null;
  const direct =
    person.regiment ||
    person.regiment_name ||
    person.regt_name ||
    person.regt ||
    person.regiment_abb ||
    person.regiment_abbr ||
    person.regiment_code ||
    null;
  if (direct) return direct;
  const unitValue = normalizeUnitNo(person.unit || person.unit_no || "");
  if (!unitValue) return null;
  const tokens = unitValue.split(" ");
  const lettersOnly = tokens.find((token) => /^[A-Za-z]{2,}$/.test(token));
  return lettersOnly || null;
}

function unitNoMatches(userUnitNo, appUnitNo) {
  if (!userUnitNo) return true;
  const userValue = normalizeUnitNo(userUnitNo);
  const appValue = normalizeUnitNo(appUnitNo);
  if (!userValue) return true;
  if (!appValue) return false;
  if (userValue === appValue) return true;
  return appValue.startsWith(userValue) || userValue.startsWith(appValue);
}

function matchesUnitScope(user, appRow) {
  const unitOk = !user.unit_id || appRow.unit_id === user.unit_id;
  const unitNoOk = unitNoMatches(resolveEffectiveUnitNo(user), appRow.unit_no);
  return unitOk && unitNoOk;
}

function canDeleteApplication(user, appRow) {
  if (hasRole(user, ROLE.APPLICANT)) {
    if (appRow.applicant_id !== user.id) return false;
    return (
      appRow.current_stage === STAGE.APPLICANT ||
      appRow.current_stage === STAGE.UNIT_CLERK
    );
  }
  return true;
}

function normalizeRoles(input) {
  if (!input) return ROLE.APPLICANT;
  if (Array.isArray(input)) {
    return input.map((role) => role.trim()).filter(Boolean).join(",");
  }
  return input
    .toString()
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean)
    .join(",");
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

app.get("/", (req, res) => {
  res.json({ ok: true, name: "Army Admission API" });
});

app.post("/auth/login", async (req, res) => {
  const { service_no, e_no, password, name, unit_id, rhq_id } = req.body;
  const providedId = e_no || service_no;
  if (!providedId || !password) {
    return res.status(400).json({ error: "e_no and password required" });
  }

  let resolvedServiceNo = providedId;
  let resolvedName = name || "Applicant";
  let resolvedUnitId = unit_id || 1;
  let resolvedRhqId = rhq_id || 1;

  if (EXTERNAL_AUTH_ENABLED && EXTERNAL_AUTH_URL) {
    try {
      const response = await fetch(EXTERNAL_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ e_no: providedId, password })
      });
      const data = await response.json();
      if (!response.ok || data?.status !== "success") {
        return res.status(401).json({
          error: data?.message || "External login failed"
        });
      }
      const escort = data.escort || {};
      resolvedServiceNo = escort.eno || service_no;
      resolvedName = escort.name || resolvedName;
    } catch (err) {
      return res.status(502).json({ error: "External auth unavailable" });
    }
  } else {
    if (password !== "demo123") {
      return res.status(401).json({ error: "Invalid demo password" });
    }
  }

  const [rows] = await pool.query(
    "SELECT * FROM users WHERE service_no = ? LIMIT 1",
    [resolvedServiceNo]
  );
  let user = rows[0];
  if (!user) {
    const [result] = await pool.query(
      "INSERT INTO users (service_no, name, roles, unit_id, rhq_id) VALUES (?, ?, ?, ?, ?)",
      [
        resolvedServiceNo,
        resolvedName,
        ROLE.APPLICANT,
        resolvedUnitId,
        resolvedRhqId
      ]
    );
    const [created] = await pool.query(
      "SELECT * FROM users WHERE id = ? LIMIT 1",
      [result.insertId]
    );
    user = created[0];
  } else if (resolvedName && user.name !== resolvedName) {
    await pool.query("UPDATE users SET name = ? WHERE id = ?", [
      resolvedName,
      user.id
    ]);
    user = { ...user, name: resolvedName };
  }

  if (user?.active === 0) {
    return res.status(403).json({ error: "User inactive" });
  }
  const token = encodeToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      service_no: user.service_no,
      roles: user.roles.split(","),
      unit_id: user.unit_id,
      rhq_id: user.rhq_id
    }
  });
});

app.post("/auth/external", async (req, res) => {
  const { e_no, name, unit_id, rhq_id } = req.body;
  if (!e_no) {
    return res.status(400).json({ error: "e_no required" });
  }
  const resolvedUnitId = unit_id || 1;
  const resolvedRhqId = rhq_id || 1;
  const strPerson = await fetchStrPerson(e_no);
  const strRegiment = resolveStrRegiment(strPerson);
  const strUnitNo = normalizeUnitNo(strPerson?.unit) || null;
  await pool.query(
    `INSERT INTO users (service_no, name, roles, unit_id, rhq_id)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       unit_id = VALUES(unit_id),
       rhq_id = VALUES(rhq_id),
       roles = IF(roles IS NULL OR roles = '', VALUES(roles), roles)`,
    [e_no, name || "Applicant", ROLE.APPLICANT, resolvedUnitId, resolvedRhqId]
  );
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE service_no = ? LIMIT 1",
    [e_no]
  );
  let user = rows[0];
  if (user?.active === 0) {
    return res.status(403).json({ error: "User inactive" });
  }
  if (strRegiment || strUnitNo) {
    const roleList = String(user?.roles || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
    const skipUnitNo = roleList.some((role) =>
      [ROLE.ADMIN, ROLE.UNIT_CLERK, ROLE.UNIT_ADJUTANT, ROLE.UNIT_CO].includes(
        role
      )
    );
    await pool.query(
      `UPDATE users
       SET regiment = COALESCE(?, regiment),
           unit_no = CASE WHEN ? THEN unit_no ELSE COALESCE(?, unit_no) END
       WHERE service_no = ?`,
      [strRegiment, skipUnitNo ? 1 : 0, strUnitNo, e_no]
    );
    const [updatedRows] = await pool.query(
      "SELECT * FROM users WHERE service_no = ? LIMIT 1",
      [e_no]
    );
    if (updatedRows[0]) {
      user = updatedRows[0];
    }
  }

  const token = encodeToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      service_no: user.service_no,
      roles: user.roles.split(","),
      unit_id: user.unit_id,
      rhq_id: user.rhq_id,
      regiment: user.regiment || null,
      unit_no: user.unit_no || null
    }
  });
});

app.post("/auth/admin/login", async (req, res) => {
  const { email, password } = req.body;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return res.status(500).json({ error: "Admin login not configured" });
  }
  if (!email || !password) {
    return res.status(400).json({ error: "email and password required" });
  }
  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  await pool.query(
    `INSERT INTO users (service_no, name, roles)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       roles = VALUES(roles)`,
    [ADMIN_EMAIL, ADMIN_NAME, ROLE.ADMIN]
  );
  const [rows] = await pool.query(
    "SELECT * FROM users WHERE service_no = ? LIMIT 1",
    [ADMIN_EMAIL]
  );
  const user = rows[0];
  if (user?.active === 0) {
    return res.status(403).json({ error: "User inactive" });
  }

  const token = encodeToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      service_no: user.service_no,
      roles: user.roles.split(","),
      unit_id: user.unit_id,
      rhq_id: user.rhq_id,
      regiment: user.regiment || null,
      unit_no: user.unit_no || null
    }
  });
});

app.get("/me", authRequired, async (req, res) => {
  res.json(req.user);
});

app.get("/admin/users", authRequired, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, service_no, name, roles, regiment, unit_no, unit_id, rhq_id, active, created_at FROM users ORDER BY created_at DESC"
  );
  if (isMasterAdmin(req.user)) {
    return res.json(rows);
  }
  const isRhqAdmin = hasRole(req.user, ROLE.RHQ_ADMIN);
  const unitRoleSet = new Set([
    ROLE.UNIT_CLERK,
    ROLE.UNIT_ADJUTANT,
    ROLE.UNIT_CO
  ]);
  const rhqRoleSet = new Set([
    ROLE.RHQ_CLERK,
    ROLE.RHQ_GSO,
    ROLE.CENTRE_COMMANDANT
  ]);
  const filtered = rows.filter((row) => {
    if (String(row.service_no || "").toLowerCase() === ADMIN_EMAIL?.toLowerCase()) {
      return false;
    }
    const regimentOk = !req.user.regiment || row.regiment === req.user.regiment;
    const unitOk = isRhqAdmin
      ? true
      : unitNoMatches(req.user.unit_no, normalizeUnitNo(row.unit_no));
    if (!regimentOk || !unitOk) return false;
    const roleList = String(row.roles || "")
      .split(",")
      .map((role) => role.trim())
      .filter(Boolean);
    if (roleList.length === 0) return false;
    if (isRhqAdmin) {
      return roleList.every((role) => rhqRoleSet.has(role));
    }
    return roleList.every((role) => unitRoleSet.has(role));
  });
  res.json(filtered);
});

app.get("/admin/users/lookup", authRequired, requireAdmin, async (req, res) => {
  const serviceNo = String(req.query.service_no || "").trim();
  if (!serviceNo) {
    return res.status(400).json({ error: "service_no required" });
  }
  const [rows] = await pool.query(
    "SELECT id, service_no, name, roles, regiment, unit_no, unit_id, rhq_id, active FROM users WHERE service_no = ? LIMIT 1",
    [serviceNo]
  );
  const user = rows[0];
  if (user) {
    if (
      !isMasterAdmin(req.user) &&
      String(user.service_no || "").toLowerCase() === ADMIN_EMAIL?.toLowerCase()
    ) {
      return res.status(403).json({ error: "Master admin access required" });
    }
    if (!isMasterAdmin(req.user)) {
      const roleList = String(user.roles || "")
        .split(",")
        .map((role) => role.trim())
        .filter(Boolean);
      const rhqRoleSet = new Set([
        ROLE.RHQ_CLERK,
        ROLE.RHQ_GSO,
        ROLE.CENTRE_COMMANDANT
      ]);
      const unitRoleSet = new Set([
        ROLE.UNIT_CLERK,
        ROLE.UNIT_ADJUTANT,
        ROLE.UNIT_CO
      ]);
      const allowedSet = hasRole(req.user, ROLE.RHQ_ADMIN)
        ? rhqRoleSet
        : unitRoleSet;
      if (!roleList.every((role) => allowedSet.has(role))) {
        return res.status(403).json({ error: "Not permitted" });
      }
    }
    return res.json(user);
  }

  if (!STR_API_TOKEN) {
    return res.status(400).json({ error: "STR lookup not configured" });
  }

  try {
    const url = new URL("https://str.army.lk/api/get_person/");
    url.searchParams.set("str-token", STR_API_TOKEN);
    url.searchParams.set("e_no", serviceNo);
    const response = await fetch(url.toString());
    const data = await response.json();
    const person =
      (Array.isArray(data) ? data[0] : null) ||
      data?.person?.[0] ||
      data?.data?.person?.[0];
    if (!response.ok || !person) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({
      service_no: person.eno || person.e_no || person.service_no || serviceNo,
      name:
        person.full_name ||
        person.name_with_initial ||
        person.name ||
        person.first_name,
      regiment: resolveStrRegiment(person),
      unit_no: normalizeUnitNo(person.unit) || null
    });
  } catch (err) {
    return res.status(502).json({ error: "STR lookup failed" });
  }
});

app.get("/establishments", async (req, res) => {
  const items = await fetchEstablishments();
  res.json(items);
});

app.post("/admin/users", authRequired, requireAdmin, async (req, res) => {
  const {
    service_no,
    name,
    roles,
    regiment,
    unit_no,
    unit_id,
    rhq_id,
    active
  } = req.body;
  if (!service_no || !name) {
    return res.status(400).json({ error: "service_no and name required" });
  }
  const masterAdmin = isMasterAdmin(req.user);
  let resolvedRegiment = regiment || null;
  let resolvedUnitNo = unit_no || null;
  if (!masterAdmin) {
    if (
      hasRole(req.user, ROLE.RHQ_ADMIN) &&
      req.user.regiment &&
      resolvedRegiment &&
      resolvedRegiment !== req.user.regiment
    ) {
      return res.status(403).json({ error: "Regiment scope exceeded" });
    }
    if (!hasRole(req.user, ROLE.RHQ_ADMIN)) {
      const adminUnit = normalizeUnitNo(req.user.unit_no);
      const targetUnit = normalizeUnitNo(resolvedUnitNo);
      if (adminUnit && targetUnit && targetUnit !== adminUnit) {
        return res.status(403).json({ error: "Unit scope exceeded" });
      }
    }
    resolvedRegiment = req.user.regiment || resolvedRegiment;
    resolvedUnitNo = req.user.unit_no || resolvedUnitNo;
  }
  resolvedUnitNo = normalizeUnitNo(resolvedUnitNo) || null;
  const resolvedRoles = normalizeRoles(roles);
  if (resolvedRoles) {
    const roleList = resolvedRoles.split(",");
    const allowedRoles = getAssignableRoles(req.user);
    if (!roleList.every((role) => allowedRoles.has(role))) {
      return res.status(403).json({ error: "Role assignment not permitted" });
    }
    if (roleList.includes(ROLE.ADMIN) || roleList.includes(ROLE.RHQ_ADMIN)) {
      if (!isMasterAdmin(req.user)) {
        return res.status(403).json({ error: "Master admin access required" });
      }
    }
    if (
      includesAnyRole(roleList, [ROLE.DTE_WELFARE, ROLE.DTE_DIRECTOR, ROLE.DTE_GSO2]) &&
      !isMasterAdmin(req.user)
    ) {
      return res.status(403).json({ error: "Master admin access required" });
    }
    if (
      includesAnyRole(roleList, [
        ROLE.RHQ_CLERK,
        ROLE.RHQ_GSO,
        ROLE.CENTRE_COMMANDANT,
        ROLE.GSO1
      ]) &&
      !canAssignRhqRoles(req.user)
    ) {
      return res.status(403).json({ error: "RHQ admin access required" });
    }
  }
  let resolvedRhqId = rhq_id || null;
  if (!resolvedRhqId && unit_id) {
    const [unitRows] = await pool.query(
      "SELECT rhq_id FROM units WHERE id = ? LIMIT 1",
      [unit_id]
    );
    resolvedRhqId = unitRows[0]?.rhq_id || null;
  }
  await pool.query(
    `INSERT INTO users (service_no, name, roles, regiment, unit_no, unit_id, rhq_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       roles = VALUES(roles),
       regiment = VALUES(regiment),
       unit_no = VALUES(unit_no),
       unit_id = VALUES(unit_id),
       rhq_id = VALUES(rhq_id),
       active = COALESCE(?, active)`,
    [
      service_no,
      name,
      resolvedRoles,
      resolvedRegiment,
      resolvedUnitNo,
      unit_id || null,
      resolvedRhqId,
      active === undefined ? null : active ? 1 : 0
    ]
  );
  const [rows] = await pool.query(
    "SELECT id, service_no, name, roles, regiment, unit_no, unit_id, rhq_id, active, created_at FROM users WHERE service_no = ? LIMIT 1",
    [service_no]
  );
  res.json(rows[0]);
});

app.put("/admin/users/:id", authRequired, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    name,
    roles,
    regiment,
    unit_no,
    unit_id,
    rhq_id,
    active
  } = req.body;
  const [targetRows] = await pool.query(
    "SELECT id, service_no, regiment, unit_no FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  const targetUser = targetRows[0];
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }
  if (!isMasterAdmin(req.user)) {
    if (
      String(targetUser.service_no || "").toLowerCase() ===
      ADMIN_EMAIL?.toLowerCase()
    ) {
      return res.status(403).json({ error: "Master admin access required" });
    }
  }
  const masterAdmin = isMasterAdmin(req.user);
  if (!masterAdmin && !matchesAdminScope(req.user, targetUser)) {
    return res.status(403).json({ error: "Unit scope exceeded" });
  }
  if (!masterAdmin) {
    if (
      hasRole(req.user, ROLE.RHQ_ADMIN) &&
      req.user.regiment &&
      regiment &&
      regiment !== req.user.regiment
    ) {
      return res.status(403).json({ error: "Regiment scope exceeded" });
    }
    if (!hasRole(req.user, ROLE.RHQ_ADMIN)) {
      const adminUnit = normalizeUnitNo(req.user.unit_no);
      const targetUnit = normalizeUnitNo(unit_no);
      if (adminUnit && targetUnit && targetUnit !== adminUnit) {
        return res.status(403).json({ error: "Unit scope exceeded" });
      }
    }
  }
  const resolvedRoles = roles === undefined ? null : normalizeRoles(roles);
  if (resolvedRoles) {
    const roleList = resolvedRoles.split(",");
    const allowedRoles = getAssignableRoles(req.user);
    if (!roleList.every((role) => allowedRoles.has(role))) {
      return res.status(403).json({ error: "Role assignment not permitted" });
    }
    if (roleList.includes(ROLE.ADMIN) || roleList.includes(ROLE.RHQ_ADMIN)) {
      if (!isMasterAdmin(req.user)) {
        return res.status(403).json({ error: "Master admin access required" });
      }
    }
    if (
      includesAnyRole(roleList, [ROLE.DTE_WELFARE, ROLE.DTE_DIRECTOR, ROLE.DTE_GSO2]) &&
      !isMasterAdmin(req.user)
    ) {
      return res.status(403).json({ error: "Master admin access required" });
    }
    if (
      includesAnyRole(roleList, [
        ROLE.RHQ_CLERK,
        ROLE.RHQ_GSO,
        ROLE.CENTRE_COMMANDANT,
        ROLE.GSO1
      ]) &&
      !canAssignRhqRoles(req.user)
    ) {
      return res.status(403).json({ error: "RHQ admin access required" });
    }
  }
  const resolvedUnitNo = normalizeUnitNo(unit_no) || null;
  let resolvedRhqId = rhq_id || null;
  if (!resolvedRhqId && unit_id) {
    const [unitRows] = await pool.query(
      "SELECT rhq_id FROM units WHERE id = ? LIMIT 1",
      [unit_id]
    );
    resolvedRhqId = unitRows[0]?.rhq_id || null;
  }
  await pool.query(
    `UPDATE users
     SET name = COALESCE(?, name),
      roles = COALESCE(?, roles),
      regiment = COALESCE(?, regiment),
      unit_no = COALESCE(?, unit_no),
      unit_id = ?,
      rhq_id = ?,
      active = COALESCE(?, active)
    WHERE id = ?`,
    [
      name || null,
      resolvedRoles || null,
      regiment || null,
      resolvedUnitNo,
      unit_id || null,
      resolvedRhqId,
      active === undefined ? null : active ? 1 : 0,
      id
    ]
  );
  const [rows] = await pool.query(
    "SELECT id, service_no, name, roles, regiment, unit_no, unit_id, rhq_id, active, created_at FROM users WHERE id = ? LIMIT 1",
    [id]
  );
  res.json(rows[0]);
});

app.delete("/admin/users/:id", authRequired, requireAdmin, async (req, res) => {
  if (!isMasterAdmin(req.user)) {
    return res.status(403).json({ error: "Master admin access required" });
  }
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, service_no, name, roles FROM users WHERE id = ? LIMIT 1",
      [id]
    );
    const user = rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [appRows] = await conn.query(
        "SELECT id FROM applications WHERE applicant_id = ?",
        [id]
      );
      const appIds = appRows.map((row) => row.id);

      if (appIds.length > 0) {
        const placeholders = appIds.map(() => "?").join(",");
        const [attachmentRows] = await conn.query(
          `SELECT path FROM attachments WHERE application_id IN (${placeholders})`,
          appIds
        );
        await conn.query(
          `DELETE FROM approval_steps WHERE application_id IN (${placeholders})`,
          appIds
        );
        await conn.query(
          `DELETE FROM attachments WHERE application_id IN (${placeholders})`,
          appIds
        );
        await conn.query(
          `DELETE FROM applications WHERE id IN (${placeholders})`,
          appIds
        );
        attachmentRows.forEach((row) => {
          if (!row.path) return;
          const filePath = path.join(process.cwd(), row.path);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });
      }

      await conn.query("DELETE FROM approval_steps WHERE actor_id = ?", [id]);
      await conn.query("DELETE FROM users WHERE id = ?", [id]);

      await conn.commit();
      res.json({ ok: true, deleted: user });
    } catch (txErr) {
      await conn.rollback();
      throw txErr;
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.get("/admin/units", authRequired, requireAdmin, async (req, res) => {
  const [rows] = await pool.query(
    "SELECT id, name, rhq_id FROM units ORDER BY name ASC"
  );
  res.json(rows);
});

app.post(
  "/admin/notice-pdf/upload",
  authRequired,
  requireAdmin,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "PDF file required" });
    }
    const ext = path.extname(req.file.originalname || "").toLowerCase();
    if (ext !== ".pdf") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Only .pdf files are allowed" });
    }
    if (fs.existsSync(NOTICE_PDF_PATH)) {
      const backupPath = path.join(
        uploadDir,
        `notice_backup_${Date.now()}.pdf`
      );
      fs.copyFileSync(NOTICE_PDF_PATH, backupPath);
    }
    fs.copyFileSync(req.file.path, NOTICE_PDF_PATH);
    fs.unlinkSync(req.file.path);
    res.json({ ok: true });
  }
);

app.get("/notice-pdf", (req, res) => {
  if (!fs.existsSync(NOTICE_PDF_PATH)) {
    return res.status(404).json({ error: "Notice PDF not found" });
  }
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=notice.pdf");
  res.sendFile(NOTICE_PDF_PATH);
});

app.post(
  "/admin/schools/upload",
  authRequired,
  requireAdmin,
  upload.single("file"),
  (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "CSV file required" });
    }
    const ext = path.extname(req.file.originalname || "").toLowerCase();
    if (ext !== ".csv") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Only .csv files are allowed" });
    }
    const targetPath = path.join(process.cwd(), "..", "schools.csv");
    if (fs.existsSync(targetPath)) {
      const backupPath = path.join(
        process.cwd(),
        "..",
        `schools_backup_${Date.now()}.csv`
      );
      fs.copyFileSync(targetPath, backupPath);
    }
    fs.copyFileSync(req.file.path, targetPath);
    fs.unlinkSync(req.file.path);
    res.json({ ok: true });
  }
);

app.get("/admin/schools/template", authRequired, requireAdmin, (req, res) => {
  const csv = "census_no,school_name\n";
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", "attachment; filename=schools_template.csv");
  res.send(csv);
});

app.get("/applications", authRequired, async (req, res) => {
  const user = req.user;
  const unitNoFilter = resolveEffectiveUnitNo(user);

  let query =
    "SELECT applications.*, users.name AS applicant_name FROM applications LEFT JOIN users ON applications.applicant_id = users.id";
  const params = [];
  const where = [];

  if (hasRole(user, ROLE.APPLICANT)) {
    where.push("applications.applicant_id = ?");
    params.push(user.id);
  } else if (hasRole(user, ROLE.ADMIN) && !isMasterAdmin(user)) {
    if (user.unit_id) {
      where.push("applications.unit_id = ?");
      params.push(user.unit_id);
    }
    if (unitNoFilter) {
      where.push(
        "(applications.unit_no = ? OR applications.unit_no LIKE CONCAT(?, '%') OR ? LIKE CONCAT(applications.unit_no, '%'))"
      );
      params.push(unitNoFilter, unitNoFilter, unitNoFilter);
    }
  } else if (hasRole(user, ROLE.UNIT_CLERK)) {
    where.push("applications.current_stage = ?");
    params.push(STAGE.UNIT_CLERK);
    if (user.unit_id) {
      where.push("applications.unit_id = ?");
      params.push(user.unit_id);
    }
    if (unitNoFilter) {
      where.push(
        "(applications.unit_no = ? OR applications.unit_no LIKE CONCAT(?, '%') OR ? LIKE CONCAT(applications.unit_no, '%'))"
      );
      params.push(unitNoFilter, unitNoFilter, unitNoFilter);
    }
  } else if (hasRole(user, ROLE.UNIT_ADJUTANT)) {
    where.push("applications.current_stage = ?");
    params.push(STAGE.UNIT_ADJUTANT);
    if (user.unit_id) {
      where.push("applications.unit_id = ?");
      params.push(user.unit_id);
    }
    if (unitNoFilter) {
      where.push(
        "(applications.unit_no = ? OR applications.unit_no LIKE CONCAT(?, '%') OR ? LIKE CONCAT(applications.unit_no, '%'))"
      );
      params.push(unitNoFilter, unitNoFilter, unitNoFilter);
    }
  } else if (hasRole(user, ROLE.UNIT_CO)) {
    where.push("applications.current_stage = ?");
    params.push(STAGE.UNIT_CO);
    if (user.unit_id) {
      where.push("applications.unit_id = ?");
      params.push(user.unit_id);
    }
    if (unitNoFilter) {
      where.push(
        "(applications.unit_no = ? OR applications.unit_no LIKE CONCAT(?, '%') OR ? LIKE CONCAT(applications.unit_no, '%'))"
      );
      params.push(unitNoFilter, unitNoFilter, unitNoFilter);
    }
  } else if (hasRole(user, ROLE.RHQ_CLERK)) {
    where.push("applications.current_stage = ? AND applications.rhq_id = ?");
    params.push(STAGE.RHQ_CLERK, user.rhq_id);
    if (user.regiment) {
      where.push("applications.regiment_name = ?");
      params.push(user.regiment);
    } else {
      where.push("1 = 0");
    }
  } else if (hasRole(user, ROLE.GSO1) || hasRole(user, ROLE.RHQ_GSO)) {
    where.push(
      "applications.current_stage IN (?, ?) AND applications.rhq_id = ?"
    );
    params.push(STAGE.COMMAND_APPROVALS, STAGE.GSO1, user.rhq_id);
    if (user.regiment) {
      where.push("applications.regiment_name = ?");
      params.push(user.regiment);
    } else {
      where.push("1 = 0");
    }
  } else if (hasRole(user, ROLE.CENTRE_COMMANDANT)) {
    where.push("applications.current_stage = ? AND applications.rhq_id = ?");
    params.push(STAGE.CENTRE_COMMANDANT, user.rhq_id);
    if (user.regiment) {
      where.push("applications.regiment_name = ?");
      params.push(user.regiment);
    } else {
      where.push("1 = 0");
    }
  } else if (hasRole(user, ROLE.DTE_WELFARE) || hasRole(user, ROLE.DTE_DIRECTOR)) {
    where.push("applications.current_stage = ?");
    params.push(STAGE.DTE);
  } else if (hasRole(user, ROLE.DTE_GSO2)) {
    where.push("applications.current_stage = ?");
    params.push(STAGE.DTE_GSO2);
  }

  if (where.length > 0) {
    query += ` WHERE ${where.join(" AND ")}`;
  }
  query += " ORDER BY applications.created_at DESC";

  const [rows] = await pool.query(query, params);
  res.json(rows);
});

app.get("/applications/my-actions", authRequired, async (req, res) => {
  const user = req.user;
  const [rows] = await pool.query(
    `SELECT a.*, s.action AS last_action, s.comment AS last_comment, s.created_at AS last_action_at
     FROM applications a
     JOIN approval_steps s ON s.application_id = a.id
     WHERE s.actor_id = ?
     AND s.id = (
       SELECT MAX(s2.id)
       FROM approval_steps s2
       WHERE s2.application_id = a.id AND s2.actor_id = ?
     )
     ORDER BY s.created_at DESC`,
    [user.id, user.id]
  );
  res.json(rows);
});

app.get("/applications/:id", authRequired, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [
    req.params.id
  ]);
  const appRow = rows[0];
  if (!appRow) {
    return res.status(404).json({ error: "Not found" });
  }
  res.json(appRow);
});

app.delete("/applications/:id", authRequired, async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [id]);
  const appRow = rows[0];
  if (!appRow) {
    return res.status(404).json({ error: "Not found" });
  }
  if (!canDeleteApplication(user, appRow)) {
    return res.status(403).json({ error: "Not permitted" });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [attachmentRows] = await conn.query(
      "SELECT path FROM attachments WHERE application_id = ?",
      [id]
    );
    await conn.query("DELETE FROM approval_steps WHERE application_id = ?", [id]);
    await conn.query("DELETE FROM attachments WHERE application_id = ?", [id]);
    await conn.query("DELETE FROM applications WHERE id = ?", [id]);
    await conn.commit();

    attachmentRows.forEach((row) => {
      if (!row.path) return;
      const filePath = path.join(process.cwd(), row.path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    res.json({ ok: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: "Failed to delete application" });
  } finally {
    conn.release();
  }
});

app.post(
  "/applications/:id/attachments",
  authRequired,
  upload.single("file"),
  async (req, res) => {
    const user = req.user;
    const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [
      req.params.id
    ]);
    const appRow = rows[0];
    if (!appRow) {
      return res.status(404).json({ error: "Not found" });
    }
    if (!hasRole(user, ROLE.APPLICANT) || appRow.applicant_id !== user.id) {
      return res.status(403).json({ error: "Not permitted" });
    }
    if (!req.file) {
      return res.status(400).json({ error: "File required" });
    }
    const type = (req.body.type || "general").toString();
    const relPath = `/uploads/${req.file.filename}`;
    await pool.query(
      "INSERT INTO attachments (application_id, type, filename, path) VALUES (?, ?, ?, ?)",
      [appRow.id, type, req.file.originalname, relPath]
    );
    res.json({ ok: true, path: relPath });
  }
);

app.get("/applications/:id/attachments", authRequired, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [
    req.params.id
  ]);
  const appRow = rows[0];
  if (!appRow) {
    return res.status(404).json({ error: "Not found" });
  }
  const user = req.user;
  if (
    hasRole(user, ROLE.APPLICANT) &&
    appRow.applicant_id !== user.id
  ) {
    return res.status(403).json({ error: "Not permitted" });
  }
  const [files] = await pool.query(
    "SELECT id, type, filename, path, created_at FROM attachments WHERE application_id = ? ORDER BY created_at DESC",
    [appRow.id]
  );
  res.json(files);
});

app.get("/applications/:id/pdf", authRequired, async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [
    req.params.id
  ]);
  const appRow = rows[0];
  if (!appRow) {
    return res.status(404).json({ error: "Not found" });
  }

  const [steps] = await pool.query(
    `SELECT s.*, u.name AS actor_name, u.roles AS actor_roles, u.unit_no AS actor_unit_no, u.regiment AS actor_regiment, u.service_no AS actor_service_no
     FROM approval_steps s
     LEFT JOIN users u ON s.actor_id = u.id
     WHERE s.application_id = ?
     ORDER BY s.created_at ASC`,
    [appRow.id]
  );

  const user = req.user;
  if (hasRole(user, ROLE.APPLICANT) && appRow.applicant_id !== user.id) {
    return res.status(403).json({ error: "Not permitted" });
  }

  const formA = parseJson(appRow.form_a_json);
  const formB = parseJson(appRow.form_b_json);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${appRow.application_no}.pdf"`
  );

  const doc = new PDFDocument({ size: "A4", margin: 50 });
  doc.pipe(res);

  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const left = doc.page.margins.left;
  const right = doc.page.margins.right;

  const headerNotice =
    "All applicants must submit their applications under the residential basis / past pupil basis / sibling basis. However, there are instances where, after such submission, principals refuse even to subject applicants to interviews and instead instruct them to submit applications through military channels. In such situations, the matter should be reported in writing to the Welfare Directorate immediately.";

  const drawHeader = () => {
    doc.rect(left, 40, pageWidth, 72).fill("#efefef");
    doc
      .fillColor("#1f2a2e")
      .fontSize(9)
      .text("Annex 'C' to No. 02/2022", left + 12, 46, {
        width: pageWidth - 24,
        align: "right"
      });
    doc
      .fontSize(13)
      .text(
        "Application for Admission of",
        left + 12,
        60
      );
    doc
      .text(
        `Children to Grade One in Government Schools – ${appRow.academic_year}`,
        left + 12,
        76,
        { width: pageWidth - 24 }
      );
    doc
      .fontSize(10)
      .fillColor("#4a4a4a")
      .text("Sri Lanka Army Application Form", left + 12, 94);
    doc.fillColor("#000000");
    doc.y = 114;
    doc.moveDown(0.3);
    doc
      .fontSize(8.5)
      .fillColor("#444444")
      .text(headerNotice, left + 12, doc.y + 4, {
        width: pageWidth - 24,
        align: "left"
      });
    doc.moveDown(2.2);
  };

  const sectionTitle = (title) => {
    doc.moveDown(0.4);
    doc
      .fontSize(11)
      .fillColor("#1f2a2e")
      .text(title, left, doc.y, { align: "left" });
    doc
      .moveTo(left, doc.y + 2)
      .lineTo(doc.page.width - right, doc.y + 2)
      .lineWidth(0.5)
      .strokeColor("#c4c4c4")
      .stroke();
    doc.moveDown(0.6);
    doc.fillColor("#000000");
  };

  const formatValue = (value, maxLen = 200) => {
    if (value === null || value === undefined) return "-";
    const text = String(value).replace(/\s+/g, " ").trim();
    if (!text) return "-";
    if (text.length <= maxLen) return text;
    return `${text.slice(0, maxLen - 3)}...`;
  };

  const keyValue = (label, value) => {
    doc.fontSize(9).fillColor("#444444").text(label, { continued: true });
    doc.fillColor("#000000").text(` ${formatValue(value)}`);
  };

  const twoColumnList = (
    pairsLeft,
    pairsRight,
    rowHeight = 30,
    afterSpacing = 0.4
  ) => {
    const colGap = 30;
    const colWidth = (pageWidth - colGap) / 2;
    const startY = doc.y;
    let yLeft = startY;
    let yRight = startY;

    pairsLeft.forEach(([label, value]) => {
      doc
        .fontSize(9)
        .fillColor("#444444")
        .text(label, left, yLeft, { width: colWidth });
      doc
        .fillColor("#000000")
        .text(formatValue(value, 120), left, yLeft + 12, { width: colWidth });
      yLeft += rowHeight;
    });

    pairsRight.forEach(([label, value]) => {
      doc
        .fontSize(9)
        .fillColor("#444444")
        .text(label, left + colWidth + colGap, yRight, { width: colWidth });
      doc
        .fillColor("#000000")
        .text(formatValue(value, 120), left + colWidth + colGap, yRight + 12, {
          width: colWidth
        });
      yRight += rowHeight;
    });

    doc.y = Math.max(yLeft, yRight);
    doc.moveDown(afterSpacing);
  };

  const tableRow = (cols, widths) => {
    const y = doc.y;
    cols.forEach((col, idx) => {
      doc
        .fontSize(9)
        .fillColor("#000000")
        .text(col, left + widths.slice(0, idx).reduce((a, b) => a + b, 0), y, {
          width: widths[idx]
        });
    });
    doc.y = y + 16;
  };

  const ensureSpace = (heightNeeded) => {
    const remaining = doc.page.height - doc.page.margins.bottom - doc.y;
    if (remaining < heightNeeded) {
      doc.addPage();
    }
  };

  drawHeader();

  sectionTitle("01. Applicant Details");
  twoColumnList(
    [
      ["Full Name (CAPS)", formA.applicant_full_name_caps],
      ["Name with Initials", formA.applicant_name_initials],
      ["NIC", formA.applicant_nic],
      ["Date of Birth", formA.applicant_dob],
      ["Unit", formA.unit_name],
      ["Service Number", formA.service_number]
    ],
    [
      ["Previous Service No", formA.previous_service_number],
      ["Rank / Designation", formA.rank_designation],
      ["Date of Enlistment", formA.date_of_enlistment],
      ["Present Workplace", formA.present_workplace],
      ["Permanent Address", formA.permanent_address],
      ["Contact Number", formA.contact_number]
    ]
  );
  keyValue("Religion:", formA.applicant_religion);
  doc.moveDown();

  sectionTitle("02. Child Details");
  twoColumnList(
    [
      ["Full Name (CAPS)", formA.child_full_name_caps],
      ["Name with Initials", formA.child_name_initials],
      ["Date of Birth", formA.child_dob],
      ["Age (Years)", formA.child_age_years],
      ["Age (Months)", formA.child_age_months],
      ["Age (Days)", formA.child_age_days]
    ],
    [
      ["Gender", formA.child_gender],
      ["Religion", formA.child_religion],
      ["Medium", formA.medium_of_instruction],
      ["Present School", formA.present_school],
      ["Address", formA.child_address],
      ["GN Division", formA.child_gn_division]
    ]
  );
  twoColumnList(
    [
      ["District", formA.child_district],
      ["Province", formA.child_province]
    ],
    []
  );

  sectionTitle("03. Service Status");
  keyValue("Status:", formA.service_status);
  doc.moveDown();

  sectionTitle("04. Special Information");
  const specialRows = [
    ["Twin", formA.is_twin],
    ["Special Educational Needs", formA.has_special_needs],
    ["Sports / Special Talents", formatValue(formA.special_talents, 80)]
  ];
  specialRows.forEach(([label, value]) => {
    ensureSpace(18);
    keyValue(`${label}:`, value);
    doc.moveDown(0.2);
  });

  sectionTitle("05. School Preferences");
  const schools = (formA.schools || []).filter((s) => s.census_no);
  const widths = [50, 120, pageWidth - 170];
  const ensureTableSpace = (heightNeeded) => {
    const remaining = doc.page.height - doc.page.margins.bottom - doc.y;
    if (remaining < heightNeeded) {
      doc.addPage();
    }
  };
  const drawTableHeader = () => {
    tableRow(["Priority", "Census No", "School Name"], widths);
    doc
      .moveTo(left, doc.y - 2)
      .lineTo(doc.page.width - right, doc.y - 2)
      .lineWidth(0.5)
      .strokeColor("#c4c4c4")
      .stroke();
  };

  ensureTableSpace(40);
  drawTableHeader();
  if (schools.length === 0) {
    ensureTableSpace(20);
    doc.fontSize(9).text("No schools selected.", left, doc.y + 4);
    doc.moveDown();
  } else {
    schools.forEach((s) => {
      ensureTableSpace(20);
      tableRow([s.priority, s.census_no, s.name], widths);
    });
  }

  sectionTitle("06. Other Parent (If Both in Service)");
  twoColumnList(
    [
      ["Service Number", formA.other_parent_service_no],
      ["Rank", formA.other_parent_rank],
      ["Unit / Regiment", formA.other_parent_unit]
    ],
    [
      ["Name with Initials", formA.other_parent_name_initials],
      ["Date of Enlistment", formA.other_parent_enlistment_date],
      ["NIC", formA.other_parent_nic]
    ]
  );

  sectionTitle("07. Casualty / Disability Details");
  twoColumnList(
    [
      ["Date of Death / Missing", formA.casualty_date],
      ["Place of Death / Missing", formA.casualty_place],
      ["Disability Date", formA.disability_date],
      ["Disability Place", formA.disability_place]
    ],
    [
      ["Disability Percentage", formA.disability_percentage],
      ["On Active Service", formA.disability_on_active_service],
      ["Disability Nature", formA.disability_nature],
      ["Retired Date", formA.disability_retired_date]
    ]
  );

  sectionTitle("08. Medals / Decorations");
  twoColumnList(
    [
      ["PWV", formA.medal_pwv ? "Yes" : "No"],
      ["WV", formA.medal_wv ? "Yes" : "No"],
      ["WWV", formA.medal_wwv ? "Yes" : "No"],
      ["RWM", formA.medal_rwm ? "Yes" : "No"]
    ],
    [
      ["RSM", formA.medal_rsm ? "Yes" : "No"],
      ["VSV", formA.medal_vsv ? "Yes" : "No"],
      ["Uttama/Karyakshama", formA.medal_uttama ? "Yes" : "No"],
      ["Deshaputra", formA.medal_deshaputra ? "Yes" : "No"]
    ]
  );

  sectionTitle("09. Sports Achievements");
  keyValue("Details:", formA.sports_achievements);
  doc.moveDown();

  const declarationText =
    "I hereby certify that my child is not currently receiving education at any government, private, or recognized school, and has not received such education previously. I further certify that the information stated above by me is true, and I am aware that if any information provided in this application is proven to be false for any reason, this application will be rendered null and void.\n\nFurthermore, I agree that if, even after admission to the school, any information stated in this application is proven to be false, my child will be removed from the said school and admitted to another school nominated by the Ministry of Education without any objection on my part.\n\nI also certify that, regardless of which school is granted from among the schools mentioned in the applications submitted by me, I will admit my child to that school, and that I have submitted an application under the normal admission procedure based on my permanent residence for the purpose of school admission.";

  sectionTitle("10. Applicant Declaration");
  doc
    .fontSize(8.5)
    .fillColor("#444444")
    .text(declarationText, left, doc.y, {
      width: pageWidth - 24,
      align: "left"
    });
  doc.moveDown(0.4);
  const declarationMark = formA.applicant_declaration_confirmed ? "[x]" : "[ ]";
  doc
    .fontSize(9)
    .fillColor("#000000")
    .text(`${declarationMark} Applicant confirmed declaration`, left);
  doc.moveDown(0.6);

  const adjutantForward = steps.find(
    (step) =>
      step.level === STAGE.UNIT_ADJUTANT && step.action.toLowerCase() === "forward"
  );
  if (adjutantForward) {
    sectionTitle("Adjutant Forwarded");
    doc
      .fontSize(12)
      .fillColor("#1f2a2e")
      .text("FORWARDED", left, doc.y + 6);
    doc
      .rect(left, doc.y + 2, 140, 36)
      .lineWidth(1)
      .strokeColor("#1f2a2e")
      .stroke();
    doc.moveDown(2.2);
    doc
      .fontSize(9)
      .fillColor("#444444")
      .text(`Adjutant: ${adjutantForward.actor_name || "-"}`);
    doc.text(`Unit: ${adjutantForward.actor_unit_no || "-"}`);
    doc.text(`Regiment: ${adjutantForward.actor_regiment || "-"}`);
    doc
      .text(`Date: ${new Date(adjutantForward.created_at).toLocaleDateString()}`);
    doc.moveDown(0.5);
  }

  const coApprove = steps.find((step) => {
    const action = String(step.action || "").toLowerCase();
    const hasStamp = String(step.comment || "").includes("[CO Stamp:");
    const isCoRole = String(step.actor_roles || "").includes(ROLE.UNIT_CO);
    return (
      step.level === STAGE.UNIT_CO ||
      (isCoRole && (action === "recommend" || hasStamp))
    );
  });
  if (coApprove) {
    sectionTitle("Unit CO Recommendation");
    doc
      .fontSize(12)
      .fillColor("#1f2a2e")
      .text("RECOMMENDED", left, doc.y + 6);
    doc
      .rect(left, doc.y + 2, 160, 40)
      .lineWidth(1)
      .strokeColor("#1f2a2e")
      .stroke();
    doc.moveDown(2.4);
    doc
      .fontSize(9)
      .fillColor("#444444")
      .text(`CO: ${coApprove.actor_name || "-"}`);
    if (coApprove.actor_service_no) {
      doc.text(`Service No: ${coApprove.actor_service_no}`);
    }
    doc.text(`Unit: ${coApprove.actor_unit_no || "-"}`);
    doc.text(`Regiment: ${coApprove.actor_regiment || "-"}`);
    doc.text(`Date: ${new Date(coApprove.created_at).toLocaleDateString()}`);
    doc.moveDown(0.5);
  }

  const centreApprove = steps.find((step) => {
    if (step.level !== STAGE.COMMAND_APPROVALS) return false;
    if (step.action.toLowerCase() !== "approve") return false;
    return (step.actor_roles || "").includes(ROLE.CENTRE_COMMANDANT);
  });
  if (centreApprove) {
    sectionTitle("Centre Commandant Approval");
    doc
      .fontSize(12)
      .fillColor("#1f2a2e")
      .text("APPROVED", left, doc.y + 6);
    doc
      .rect(left, doc.y + 2, 140, 36)
      .lineWidth(1)
      .strokeColor("#1f2a2e")
      .stroke();
    doc.moveDown(2.2);
    doc
      .fontSize(9)
      .fillColor("#444444")
      .text(`Centre Commandant: ${centreApprove.actor_name || "-"}`);
    doc.text(`Unit: ${centreApprove.unit_name || "-"}`);
    doc.text(
      `Date: ${new Date(centreApprove.created_at).toLocaleDateString()}`
    );
    doc.moveDown(0.5);
  }

  const gso2Approve = steps.find((step) => {
    if (step.level !== STAGE.DTE_GSO2) return false;
    if (step.action.toLowerCase() !== "approve") return false;
    return (step.actor_roles || "").includes(ROLE.DTE_GSO2);
  });
  if (gso2Approve) {
    sectionTitle("Dte Welfare GSO II Approval");
    doc
      .fontSize(12)
      .fillColor("#1f2a2e")
      .text("APPROVED", left, doc.y + 6);
    doc
      .rect(left, doc.y + 2, 140, 36)
      .lineWidth(1)
      .strokeColor("#1f2a2e")
      .stroke();
    doc.moveDown(2.2);
    doc
      .fontSize(9)
      .fillColor("#444444")
      .text(`GSO II: ${gso2Approve.actor_name || "-"}`);
    doc.text(`Unit: ${gso2Approve.unit_name || "-"}`);
    doc.text(`Date: ${new Date(gso2Approve.created_at).toLocaleDateString()}`);
    doc.moveDown(0.5);
  }

  doc.end();
});

app.post("/applications", authRequired, async (req, res) => {
  const user = req.user;
  if (!hasRole(user, ROLE.APPLICANT)) {
    return res.status(403).json({ error: "Applicants only" });
  }

  const { formA, formB, academic_year, action, id } = req.body;
  if (!formA || !formB || !academic_year) {
    return res.status(400).json({ error: "formA, formB, academic_year required" });
  }

  const strPerson = await fetchStrPerson(user.service_no);
  const resolvedRegiment =
    resolveStrRegiment(strPerson) || formA.regiment_name || null;
  const resolvedUnitNo =
    normalizeUnitNo(strPerson?.unit || formA.unit_name) || null;
  if (resolvedRegiment || resolvedUnitNo) {
    await pool.query(
      "UPDATE users SET regiment = COALESCE(?, regiment), unit_no = CASE WHEN unit_no IS NULL OR unit_no = '' THEN ? ELSE unit_no END WHERE id = ?",
      [resolvedRegiment, resolvedUnitNo, user.id]
    );
  }
  const resolvedFormA = {
    ...formA,
    regiment_name: resolvedRegiment,
    unit_name: resolvedUnitNo
  };

  const status = action === "submit" ? STATUS.SUBMITTED : STATUS.DRAFT;
  const stage = action === "submit" ? STAGE.UNIT_CLERK : STAGE.APPLICANT;

  if (id) {
    await pool.query(
      "UPDATE applications SET form_a_json = ?, form_b_json = ?, academic_year = ?, status = ?, current_stage = ?, regiment_name = ?, unit_no = ? WHERE id = ? AND applicant_id = ?",
      [
        JSON.stringify(resolvedFormA),
        JSON.stringify(formB),
        academic_year,
        status,
        stage,
        resolvedRegiment,
        resolvedUnitNo,
        id,
        user.id
      ]
    );
    return res.json({ ok: true, id });
  }

  const applicationNo = `APP-${new Date().getFullYear()}-${uuidv4().slice(0, 6)}`;
  const [result] = await pool.query(
    "INSERT INTO applications (application_no, applicant_id, unit_id, rhq_id, regiment_name, unit_no, academic_year, status, current_stage, form_a_json, form_b_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      applicationNo,
      user.id,
      user.unit_id,
      user.rhq_id,
      resolvedRegiment,
      resolvedUnitNo,
      academic_year,
      status,
      stage,
      JSON.stringify(resolvedFormA),
      JSON.stringify(formB)
    ]
  );

  if (action === "submit") {
    await pool.query(
      "INSERT INTO approval_steps (application_id, level, actor_id, action, comment) VALUES (?, ?, ?, ?, ?)",
      [result.insertId, STAGE.APPLICANT, user.id, "submit", null]
    );
  }

  res.json({ ok: true, id: result.insertId, application_no: applicationNo });
});

app.post("/applications/:id/action", authRequired, async (req, res) => {
  const user = req.user;
  const { action, comment } = req.body;
  const [rows] = await pool.query("SELECT * FROM applications WHERE id = ?", [
    req.params.id
  ]);
  const appRow = rows[0];
  if (!appRow) {
    return res.status(404).json({ error: "Not found" });
  }

  let nextStatus = appRow.status;
  let nextStage = appRow.current_stage;
  let updates = {};
  let handled = false;

  function returnToApplicant() {
    nextStatus = STATUS.RETURNED;
    nextStage = STAGE.APPLICANT;
  }

  if (action === "return" && !hasRole(user, ROLE.APPLICANT)) {
    returnToApplicant();
    handled = true;
  } else if (hasRole(user, ROLE.UNIT_CLERK) && appRow.current_stage === STAGE.UNIT_CLERK) {
    if (action === "return") returnToApplicant();
    if (action === "forward") nextStage = STAGE.UNIT_ADJUTANT;
    handled = true;
  } else if (
    hasRole(user, ROLE.UNIT_ADJUTANT) &&
    appRow.current_stage === STAGE.UNIT_ADJUTANT
  ) {
    if (action === "return") returnToApplicant();
    if (action === "forward") nextStage = STAGE.UNIT_CO;
    handled = true;
  } else if (hasRole(user, ROLE.UNIT_CO) && appRow.current_stage === STAGE.UNIT_CO) {
    if (action === "return") returnToApplicant();
    if (action === "recommend" || action === "approve") {
      nextStatus = STATUS.UNIT_ENDORSED;
      nextStage = STAGE.RHQ_CLERK;
    }
    if (action === "reject") {
      nextStatus = STATUS.REJECTED;
      nextStage = STAGE.CLOSED;
    }
    handled = true;
  } else if (
    hasRole(user, ROLE.RHQ_CLERK) &&
    appRow.current_stage === STAGE.RHQ_CLERK
  ) {
    if (action === "return") returnToApplicant();
    if (action === "forward") {
      nextStatus = STATUS.RHQ_APPROVED;
      nextStage = STAGE.GSO1;
    }
    handled = true;
  } else if (
    (hasRole(user, ROLE.GSO1) || hasRole(user, ROLE.RHQ_GSO)) &&
    (appRow.current_stage === STAGE.COMMAND_APPROVALS ||
      appRow.current_stage === STAGE.GSO1)
  ) {
    if (action === "return") returnToApplicant();
    if (action === "forward") {
      updates.gso1_approved = 1;
      nextStage = STAGE.CENTRE_COMMANDANT;
    }
    handled = true;
  } else if (
    hasRole(user, ROLE.CENTRE_COMMANDANT) &&
    appRow.current_stage === STAGE.CENTRE_COMMANDANT
  ) {
    if (action === "return") returnToApplicant();
    if (action === "recommend") {
      updates.cc_approved = 1;
      nextStage = STAGE.DTE;
    }
    handled = true;
  } else if (
    (hasRole(user, ROLE.DTE_WELFARE) || hasRole(user, ROLE.DTE_DIRECTOR)) &&
    appRow.current_stage === STAGE.DTE
  ) {
    if (action === "return") returnToApplicant();
    if (action === "forward") {
      nextStage = STAGE.DTE_GSO2;
    }
    handled = true;
  } else if (
    hasRole(user, ROLE.DTE_GSO2) &&
    appRow.current_stage === STAGE.DTE_GSO2
  ) {
    if (action === "reject") {
      nextStatus = STATUS.REJECTED;
      nextStage = STAGE.CLOSED;
    }
    if (action === "approve") {
      nextStatus = STATUS.DTE_APPROVED;
      nextStage = STAGE.CLOSED;
    }
    handled = true;
  } else {
    handled = false;
  }
  if (!handled) {
    return res.status(403).json({ error: "Action not permitted" });
  }

  await pool.query(
    "UPDATE applications SET status = ?, current_stage = ?, cc_approved = ?, gso1_approved = ? WHERE id = ?",
    [
      nextStatus,
      nextStage,
      updates.cc_approved ?? appRow.cc_approved,
      updates.gso1_approved ?? appRow.gso1_approved,
      appRow.id
    ]
  );

  await pool.query(
    "INSERT INTO approval_steps (application_id, level, actor_id, action, comment) VALUES (?, ?, ?, ?, ?)",
    [appRow.id, appRow.current_stage, user.id, action, comment || null]
  );

  res.json({ ok: true, status: nextStatus, current_stage: nextStage });
});

app.get("/applications/:id/steps", authRequired, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT s.*, u.name AS actor_name, u.roles AS actor_roles
     FROM approval_steps s
     LEFT JOIN users u ON s.actor_id = u.id
     WHERE s.application_id = ?
     ORDER BY s.created_at ASC`,
    [req.params.id]
  );
  res.json(rows);
});

app.get("/schools", authRequired, (req, res) => {
  const q = (req.query.q || "").toString().toLowerCase();
  const medium = (req.query.medium || "").toString().toLowerCase();
  const csvFile = medium === "tamil" ? "tamilschools.csv" : "schools.csv";
  const csvPath = path.join(process.cwd(), "..", csvFile);
  if (!fs.existsSync(csvPath)) {
    return res.json([]);
  }
  const raw = fs.readFileSync(csvPath, "utf8");
  let lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines[0]?.toLowerCase().includes("census_no")) {
    lines = lines.slice(1);
  }
  let results = lines
    .map((line) => {
      const parts = line.split(",");
      if (parts.length >= 2) {
        const [census_no, name] = parts;
        return { census_no: census_no?.trim(), name: name?.trim() };
      }
      return { census_no: "", name: parts[0]?.trim() };
    })
    .filter((row) => row.name);

  if (q) {
    results = results
      .filter((row) => row.name.toLowerCase().includes(q))
      .slice(0, 20);
  }
  res.json(results);
});

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
