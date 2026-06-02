// server.js — project root

import express from "express";
import fs      from "fs";
import path    from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app       = express();
const PORT      = 3001;

app.use(express.json());

// ─── File paths ───────────────────────────────────────────────────────────────
const PATIENTS_FILE     = path.join(__dirname, "maternal-portal-data.xlsx");
const APPOINTMENTS_FILE = path.join(__dirname, "appointments-data.xlsx");

// ─── Sheet names ──────────────────────────────────────────────────────────────
const SH_PATIENTS  = "Patients";
const SH_TEMPLATES = "Templates";

const SH_REQUESTS    = "Requests";
const SH_SCHEDULED   = "Scheduled";
const SH_PAST        = "Past";

// ─── Date helpers ─────────────────────────────────────────────────────────────

// YYYY-MM-DD string → JS Date (local midnight)
function toDate(str) {
  if (!str || str === "N/A" || str === "") return null;
  const [y, m, d] = str.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

// Excel cell value → YYYY-MM-DD string
function fromExcelDate(val) {
  if (!val || val === "") return "";
  if (val instanceof Date) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, "0");
    const d = String(val.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(val))) return val;
  return "";
}

// Apply DD/MM/YYYY display format to a date column across all data rows
function applyDateFormat(ws, colIndex) {
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let r = range.s.r + 1; r <= range.e.r; r++) {
    const addr = XLSX.utils.encode_cell({ r, c: colIndex });
    if (ws[addr] && ws[addr].t === "d") {
      ws[addr].z = "DD/MM/YYYY";
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  PATIENTS  (maternal-portal-data.xlsx)
// ─────────────────────────────────────────────────────────────────────────────

function readPatientsWorkbook() {
  if (!fs.existsSync(PATIENTS_FILE)) return null;
  return XLSX.readFile(PATIENTS_FILE, { cellDates: true });
}

function buildPatientsWorkbook(patients, templates) {
  const wb = XLSX.utils.book_new();

  // ── Patients sheet ──────────────────────────────────────────────────────────
  const patientRows = patients.map((p) => ({
    "Patient ID":            p.id,
    "Name":                  p.name,
    "Contact":               p.contact,
    "Age":                   p.age === "" || p.age == null ? "" : Number(p.age),
    "Condition":             p.condition      || "",
    "Due Date":              toDate(p.dueDate) || "",
    "First Appointment":     toDate(p.firstAppointment) || "",
    "Last Appointment":      toDate(p.lastAppointment)  || "",
    "Diagnosis":             p.diagnosis      || "",
    "Remarks":               p.remarks        || "",
    "Active":                p.active ? "true" : "false",
  }));

  const wsP = XLSX.utils.json_to_sheet(patientRows, { cellDates: true });

  // Columns: 0=ID 1=Name 2=Contact 3=Age 4=Condition 5=DueDate 6=FirstAppt 7=LastAppt 8=Diagnosis 9=Remarks 10=Active
  applyDateFormat(wsP, 5);
  applyDateFormat(wsP, 6);
  applyDateFormat(wsP, 7);

  wsP["!cols"] = [
    { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 6 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
    { wch: 30 }, { wch: 30 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsP, SH_PATIENTS);

  // ── Templates sheet (preserved as-is) ──────────────────────────────────────
  const templateRows = templates.map((t) => ({ "Week": t.week, "Message": t.message }));
  const wsT = XLSX.utils.json_to_sheet(templateRows);
  wsT["!cols"] = [{ wch: 6 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsT, SH_TEMPLATES);

  return wb;
}

function parsePatients(wb) {
  const ws = wb.Sheets[SH_PATIENTS];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true })
    .map((row) => ({
      id:               String(row["Patient ID"]        ?? "").trim(),
      name:             String(row["Name"]              ?? "").trim(),
      contact:          String(row["Contact"]           ?? "").trim(),
      age:              row["Age"] === "" || row["Age"] == null ? "" : String(row["Age"]),
      condition:        String(row["Condition"]         ?? "").trim(),
      dueDate:          fromExcelDate(row["Due Date"]),
      firstAppointment: fromExcelDate(row["First Appointment"]),
      lastAppointment:  fromExcelDate(row["Last Appointment"]),
      diagnosis:        String(row["Diagnosis"]         ?? "").trim(),
      remarks:          String(row["Remarks"]           ?? "").trim(),
      active:           String(row["Active"]).toLowerCase() === "true" ||
                        row["Active"] === true || row["Active"] === 1,
    }))
    .filter((p) => p.id);
}

function parseTemplates(wb) {
  const ws = wb.Sheets[SH_TEMPLATES];
  if (!ws) return [];
  const map = {};
  XLSX.utils.sheet_to_json(ws, { defval: "" }).forEach((row) => {
    const w = Number(row["Week"]);
    if (w >= 1 && w <= 40) map[w] = String(row["Message"] ?? "").trim();
  });
  return Array.from({ length: 40 }, (_, i) => {
    const w = i + 1;
    return { week: w, message: map[w] || `Week ${w} — Please add the health guidance message for this week.` };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
//  APPOINTMENTS  (appointments-data.xlsx)
// ─────────────────────────────────────────────────────────────────────────────

function readAppointmentsWorkbook() {
  if (!fs.existsSync(APPOINTMENTS_FILE)) return null;
  return XLSX.readFile(APPOINTMENTS_FILE, { cellDates: true });
}

function buildAppointmentsWorkbook(requests, scheduled, past) {
  const wb = XLSX.utils.book_new();

  // ── Requests sheet ──────────────────────────────────────────────────────────
  const reqRows = requests.map((r) => ({
    "Request ID":     r.id,
    "Patient ID":     r.patientId,
    "Patient Name":   r.patientName,
    "Contact":        r.contact,
    "Age":            r.age,
    "Requested Date": toDate(r.requestedDate) || "",
    "Requested Slot": r.requestedSlot,
    "Requested On":   toDate(r.requestedOn)   || "",
  }));
  const wsReq = XLSX.utils.json_to_sheet(reqRows, { cellDates: true });
  applyDateFormat(wsReq, 5);
  applyDateFormat(wsReq, 7);
  wsReq["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 24 }, { wch: 14 },
    { wch: 6  }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsReq, SH_REQUESTS);

  // ── Scheduled sheet ─────────────────────────────────────────────────────────
  const schRows = scheduled.map((s) => ({
    "Appointment ID":   s.id,
    "Patient ID":       s.patientId,
    "Patient Name":     s.patientName,
    "Contact":          s.contact,
    "Age":              s.age,
    "Appointment Date": toDate(s.appointmentDate) || "",
    "Appointment Time": s.appointmentTime,
  }));
  const wsSch = XLSX.utils.json_to_sheet(schRows, { cellDates: true });
  applyDateFormat(wsSch, 5);
  wsSch["!cols"] = [
    { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 14 },
    { wch: 6  }, { wch: 16 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsSch, SH_SCHEDULED);

  // ── Past sheet ──────────────────────────────────────────────────────────────
  const pastRows = past.map((p) => ({
    "Appointment ID":   p.id,
    "Patient ID":       p.patientId,
    "Patient Name":     p.patientName,
    "Contact":          p.contact,
    "Age":              p.age,
    "Appointment Date": toDate(p.appointmentDate) || "",
    "Appointment Time": p.appointmentTime,
  }));
  const wsPast = XLSX.utils.json_to_sheet(pastRows, { cellDates: true });
  applyDateFormat(wsPast, 5);
  wsPast["!cols"] = [
    { wch: 14 }, { wch: 12 }, { wch: 24 }, { wch: 14 },
    { wch: 6  }, { wch: 16 }, { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPast, SH_PAST);

  return wb;
}

function parseRequests(wb) {
  const ws = wb?.Sheets[SH_REQUESTS];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true }).map((row) => ({
    id:            String(row["Request ID"]     ?? "").trim(),
    patientId:     String(row["Patient ID"]     ?? "").trim(),
    patientName:   String(row["Patient Name"]   ?? "").trim(),
    contact:       String(row["Contact"]        ?? "").trim(),
    age:           String(row["Age"]            ?? "").trim(),
    requestedDate: fromExcelDate(row["Requested Date"]),
    requestedSlot: String(row["Requested Slot"] ?? "").trim(),
    requestedOn:   fromExcelDate(row["Requested On"]),
  })).filter((r) => r.id);
}

function parseScheduled(wb) {
  const ws = wb?.Sheets[SH_SCHEDULED];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true }).map((row) => ({
    id:              String(row["Appointment ID"]   ?? "").trim(),
    patientId:       String(row["Patient ID"]       ?? "").trim(),
    patientName:     String(row["Patient Name"]     ?? "").trim(),
    contact:         String(row["Contact"]          ?? "").trim(),
    age:             String(row["Age"]              ?? "").trim(),
    appointmentDate: fromExcelDate(row["Appointment Date"]),
    appointmentTime: String(row["Appointment Time"] ?? "").trim(),
  })).filter((r) => r.id);
}

function parsePast(wb) {
  const ws = wb?.Sheets[SH_PAST];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true }).map((row) => ({
    id:              String(row["Appointment ID"]   ?? "").trim(),
    patientId:       String(row["Patient ID"]       ?? "").trim(),
    patientName:     String(row["Patient Name"]     ?? "").trim(),
    contact:         String(row["Contact"]          ?? "").trim(),
    age:             String(row["Age"]              ?? "").trim(),
    appointmentDate: fromExcelDate(row["Appointment Date"]),
    appointmentTime: String(row["Appointment Time"] ?? "").trim(),
  })).filter((r) => r.id);
}

// Move past-due scheduled appointments into the past sheet
function migratePastAppointments(scheduled, past) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stillScheduled = [];
  const newPast        = [...past];

  for (const appt of scheduled) {
    const d = toDate(appt.appointmentDate);
    if (d && d < today) {
      // Already in past? skip duplicate
      if (!newPast.find((p) => p.id === appt.id)) newPast.push(appt);
    } else {
      stillScheduled.push(appt);
    }
  }

  return { scheduled: stillScheduled, past: newPast };
}

function saveAppointments(requests, scheduled, past) {
  // Run migration before saving
  const { scheduled: sch, past: p } = migratePastAppointments(scheduled, past);
  const wb = buildAppointmentsWorkbook(requests, sch, p);
  XLSX.writeFile(wb, APPOINTMENTS_FILE, { cellDates: true });
  return { requests, scheduled: sch, past: p };
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTES — Patients
// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/data", (req, res) => {
  try {
    const wb = readPatientsWorkbook();
    if (!wb) return res.json({ exists: false, patients: [], templates: [] });
    res.json({ exists: true, patients: parsePatients(wb), templates: parseTemplates(wb) });
  } catch (err) {
    console.error("GET /api/data:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients", (req, res) => {
  try {
    const { patients } = req.body;
    if (!Array.isArray(patients)) return res.status(400).json({ error: "patients must be an array" });
    const wb        = readPatientsWorkbook();
    const templates = wb ? parseTemplates(wb) : [];
    const newWb     = buildPatientsWorkbook(patients, templates);
    XLSX.writeFile(newWb, PATIENTS_FILE, { cellDates: true });
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/patients:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/templates", (req, res) => {
  try {
    const { templates } = req.body;
    if (!Array.isArray(templates)) return res.status(400).json({ error: "templates must be an array" });
    const wb       = readPatientsWorkbook();
    const patients = wb ? parsePatients(wb) : [];
    const newWb    = buildPatientsWorkbook(patients, templates);
    XLSX.writeFile(newWb, PATIENTS_FILE, { cellDates: true });
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/templates:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTES — Appointments
// ─────────────────────────────────────────────────────────────────────────────

// GET all appointments data (runs migration on load)
app.get("/api/appointments", (req, res) => {
  try {
    const wb = readAppointmentsWorkbook();

    let requests  = wb ? parseRequests(wb)  : [];
    let scheduled = wb ? parseScheduled(wb) : [];
    let past      = wb ? parsePast(wb)      : [];

    // Auto-migrate past-due scheduled appointments → past
    const migrated = migratePastAppointments(scheduled, past);
    if (migrated.scheduled.length !== scheduled.length) {
      saveAppointments(requests, migrated.scheduled, migrated.past);
      scheduled = migrated.scheduled;
      past      = migrated.past;
    }

    res.json({ ok: true, requests, scheduled, past });
  } catch (err) {
    console.error("GET /api/appointments:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST approve a request → moves to scheduled
app.post("/api/appointments/approve", (req, res) => {
  try {
    const { requestId, appointmentDate, appointmentTime } = req.body;
    const wb = readAppointmentsWorkbook();

    let requests  = wb ? parseRequests(wb)  : [];
    let scheduled = wb ? parseScheduled(wb) : [];
    let past      = wb ? parsePast(wb)      : [];

    const request = requests.find((r) => r.id === requestId);
    if (!request) return res.status(404).json({ error: "Request not found" });

    // Remove from requests
    requests = requests.filter((r) => r.id !== requestId);

    // Add to scheduled
    const newAppt = {
      id:              `APT-${Date.now()}`,
      patientId:       request.patientId,
      patientName:     request.patientName,
      contact:         request.contact,
      age:             request.age,
      appointmentDate,
      appointmentTime,
    };
    scheduled = [...scheduled, newAppt];

    const result = saveAppointments(requests, scheduled, past);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("POST /api/appointments/approve:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST decline a request → removes it
app.post("/api/appointments/decline", (req, res) => {
  try {
    const { requestId } = req.body;
    const wb = readAppointmentsWorkbook();

    let requests  = wb ? parseRequests(wb)  : [];
    let scheduled = wb ? parseScheduled(wb) : [];
    let past      = wb ? parsePast(wb)      : [];

    requests = requests.filter((r) => r.id !== requestId);

    const result = saveAppointments(requests, scheduled, past);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("POST /api/appointments/decline:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST reschedule a scheduled appointment
app.post("/api/appointments/reschedule", (req, res) => {
  try {
    const { appointmentId, appointmentDate, appointmentTime } = req.body;
    const wb = readAppointmentsWorkbook();

    let requests  = wb ? parseRequests(wb)  : [];
    let scheduled = wb ? parseScheduled(wb) : [];
    let past      = wb ? parsePast(wb)      : [];

    scheduled = scheduled.map((s) =>
      s.id === appointmentId ? { ...s, appointmentDate, appointmentTime } : s
    );

    const result = saveAppointments(requests, scheduled, past);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("POST /api/appointments/reschedule:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST save all appointments (bulk update — used by context)
app.post("/api/appointments/save", (req, res) => {
  try {
    const { requests, scheduled, past } = req.body;
    const result = saveAppointments(requests || [], scheduled || [], past || []);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("POST /api/appointments/save:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST cancel a scheduled appointment → removes from scheduled
app.post("/api/appointments/cancel", (req, res) => {
  try {
    const { appointmentId } = req.body;
    const wb = readAppointmentsWorkbook();

    let requests  = wb ? parseRequests(wb)  : [];
    let scheduled = wb ? parseScheduled(wb) : [];
    let past      = wb ? parsePast(wb)      : [];

    scheduled = scheduled.filter((s) => s.id !== appointmentId);

    const result = saveAppointments(requests, scheduled, past);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("POST /api/appointments/cancel:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST add a direct appointment (bypasses requests)
app.post("/api/appointments/add", (req, res) => {
  try {
    const { appointment } = req.body;
    const wb = readAppointmentsWorkbook();

    let requests  = wb ? parseRequests(wb)  : [];
    let scheduled = wb ? parseScheduled(wb) : [];
    let past      = wb ? parsePast(wb)      : [];

    scheduled = [...scheduled, { ...appointment, id: appointment.id || `APT-${Date.now()}` }];

    const result = saveAppointments(requests, scheduled, past);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("POST /api/appointments/add:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Portal API running on http://localhost:${PORT}`);
  console.log(`📄 Patients:     ${PATIENTS_FILE}`);
  console.log(`📄 Appointments: ${APPOINTMENTS_FILE}`);
});

// =============================================================================
//  MESSAGE TEMPLATES  (message-templates.xlsx)
// =============================================================================

const MSG_TEMPLATES_FILE  = path.join(__dirname, "message-templates.xlsx");
const SH_MSG_PREGNANCY    = "Pregnancy";
const SH_MSG_OTHER        = "Other Conditions";
const SH_MSG_APPOINTMENTS = "Appointments";

// ─── Default pregnancy templates (weeks 1-40) ─────────────────────────────────
function defaultPregnancyTemplates() {
  const BASE = {
    1:  "Welcome to your pregnancy journey! Stay hydrated, take your prenatal vitamins, and schedule your first antenatal visit as soon as possible.",
    4:  "By week 4, the embryo has implanted in your uterus. You may experience early symptoms like fatigue or mild nausea. Rest well and avoid alcohol and smoking.",
    8:  "Your baby is about the size of a kidney bean! Major organs are forming. Continue taking folic acid and report any heavy bleeding to your doctor immediately.",
    12: "You've reached the end of your first trimester — congratulations! Your baby is now developing facial features. The risk of miscarriage drops significantly after this week.",
    16: "Your baby can now make sucking motions and may start to hear sounds. You might feel the first flutters of movement soon. Attend your mid-pregnancy scan.",
    20: "Halfway there! Your baby is about 25 cm long. This is typically when you'll have your anatomy scan. Keep up your iron intake to prevent anaemia.",
    24: "Your baby's lungs are developing rapidly. Now is a good time to start thinking about birth plans and antenatal classes.",
    28: "You've entered the third trimester. Watch for signs of preeclampsia such as severe headaches or swelling in your hands and face.",
    32: "Your baby is gaining weight quickly and preparing for birth. Practice your breathing exercises.",
    36: "Your baby is nearly full-term. Pack your hospital bag and make sure your support person is ready.",
    40: "Your due date has arrived! Contact your healthcare provider if you experience strong contractions, water breaking, or reduced fetal movement.",
  };
  return Array.from({ length: 40 }, (_, i) => {
    const w = i + 1;
    return {
      week:    w,
      message: BASE[w] || `Week ${w} — Please add the health guidance message for this week.`,
      ytLink:  "",
    };
  });
}

// ─── Read / write helpers ─────────────────────────────────────────────────────
function readMsgTemplatesWorkbook() {
  if (!fs.existsSync(MSG_TEMPLATES_FILE)) return null;
  return XLSX.readFile(MSG_TEMPLATES_FILE);
}

function parseMsgPregnancy(wb) {
  const ws = wb?.Sheets[SH_MSG_PREGNANCY];
  if (!ws) return defaultPregnancyTemplates();
  const rows  = XLSX.utils.sheet_to_json(ws, { defval: "" });
  const map   = {};
  rows.forEach((row) => {
    const w = Number(row["Week"]);
    if (w >= 1 && w <= 40) {
      map[w] = { message: String(row["Message"] ?? ""), ytLink: String(row["YT Link"] ?? "") };
    }
  });
  return Array.from({ length: 40 }, (_, i) => {
    const w = i + 1;
    return {
      week:    w,
      message: map[w]?.message ?? `Week ${w} — Please add the health guidance message for this week.`,
      ytLink:  map[w]?.ytLink  ?? "",
    };
  });
}

function parseMsgOther(wb) {
  const ws = wb?.Sheets[SH_MSG_OTHER];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" }).map((row) => ({
    condition: String(row["Condition"] ?? ""),
    message:   String(row["Message"]   ?? ""),
    ytLink:    String(row["YT Link"]   ?? ""),
  }));
}

function parseMsgAppointments(wb) {
  const ws = wb?.Sheets[SH_MSG_APPOINTMENTS];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "" }).map((row) => ({
    type:    String(row["Type"]    ?? ""),
    message: String(row["Message"] ?? ""),
    ytLink:  String(row["YT Link"] ?? ""),
  }));
}

function buildMsgTemplatesWorkbook(pregnancy, other, appointments) {
  const wb = XLSX.utils.book_new();

  // Pregnancy sheet
  const pregRows = pregnancy.map((t) => ({
    "Week":    t.week,
    "Message": t.message,
    "YT Link": t.ytLink || "",
  }));
  const wsP = XLSX.utils.json_to_sheet(pregRows);
  wsP["!cols"] = [{ wch: 6 }, { wch: 80 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsP, SH_MSG_PREGNANCY);

  // Other Conditions sheet
  const otherRows = (other || []).map((t) => ({
    "Condition": t.condition,
    "Message":   t.message,
    "YT Link":   t.ytLink || "",
  }));
  const wsO = XLSX.utils.json_to_sheet(otherRows.length > 0 ? otherRows : [{ "Condition": "", "Message": "", "YT Link": "" }]);
  wsO["!cols"] = [{ wch: 20 }, { wch: 80 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsO, SH_MSG_OTHER);

  // Appointments sheet
  const apptRows = (appointments || []).map((t) => ({
    "Type":    t.type,
    "Message": t.message,
    "YT Link": t.ytLink || "",
  }));
  const wsA = XLSX.utils.json_to_sheet(apptRows.length > 0 ? apptRows : [{ "Type": "", "Message": "", "YT Link": "" }]);
  wsA["!cols"] = [{ wch: 20 }, { wch: 80 }, { wch: 50 }];
  XLSX.utils.book_append_sheet(wb, wsA, SH_MSG_APPOINTMENTS);

  return wb;
}

function saveMsgTemplates(pregnancy, other, appointments) {
  const wb = buildMsgTemplatesWorkbook(pregnancy, other, appointments);
  XLSX.writeFile(wb, MSG_TEMPLATES_FILE);
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET all message templates
app.get("/api/message-templates", (req, res) => {
  try {
    const wb          = readMsgTemplatesWorkbook();
    const pregnancy   = parseMsgPregnancy(wb);
    const other       = wb ? parseMsgOther(wb)        : [];
    const appointments = wb ? parseMsgAppointments(wb) : [];
    res.json({ ok: true, pregnancy, other, appointments });
  } catch (err) {
    console.error("GET /api/message-templates:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST save pregnancy templates
app.post("/api/message-templates/pregnancy", (req, res) => {
  try {
    const { pregnancy } = req.body;
    if (!Array.isArray(pregnancy)) return res.status(400).json({ error: "pregnancy must be an array" });
    const wb    = readMsgTemplatesWorkbook();
    const other = wb ? parseMsgOther(wb) : [];
    const appts = wb ? parseMsgAppointments(wb) : [];
    saveMsgTemplates(pregnancy, other, appts);
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/message-templates/pregnancy:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST save other conditions templates
app.post("/api/message-templates/other", (req, res) => {
  try {
    const { other } = req.body;
    const wb       = readMsgTemplatesWorkbook();
    const pregnancy = wb ? parseMsgPregnancy(wb)    : defaultPregnancyTemplates();
    const appts     = wb ? parseMsgAppointments(wb)  : [];
    saveMsgTemplates(pregnancy, other || [], appts);
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/message-templates/other:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST save appointments templates
app.post("/api/message-templates/appointments", (req, res) => {
  try {
    const { appointments } = req.body;
    const wb        = readMsgTemplatesWorkbook();
    const pregnancy  = wb ? parseMsgPregnancy(wb) : defaultPregnancyTemplates();
    const other      = wb ? parseMsgOther(wb)     : [];
    saveMsgTemplates(pregnancy, other, appointments || []);
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/message-templates/appointments:", err);
    res.status(500).json({ error: err.message });
  }
});