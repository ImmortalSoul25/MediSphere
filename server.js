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
const SH_REQUESTS  = "Requests";
const SH_SCHEDULED = "Scheduled";
const SH_PAST      = "Past";

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

  const patientRows = patients.map((p) => ({
    "Patient ID":        p.id,
    "Name":              p.name,
    "Contact":           p.contact,
    "Age":               p.age === "" || p.age == null ? "" : Number(p.age),
    "Condition":         p.condition      || "",
    "Due Date":          toDate(p.dueDate) || "",
    "First Appointment": toDate(p.firstAppointment) || "",
    "Last Appointment":  toDate(p.lastAppointment)  || "",
    "Diagnosis":         p.diagnosis      || "",
    "Remarks":           p.remarks        || "",
    "Active":            p.active ? "true" : "false",
  }));

  const wsP = XLSX.utils.json_to_sheet(patientRows, { cellDates: true });
  applyDateFormat(wsP, 5);
  applyDateFormat(wsP, 6);
  applyDateFormat(wsP, 7);
  wsP["!cols"] = [
    { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 6 },
    { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
    { wch: 30 }, { wch: 30 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsP, SH_PATIENTS);

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
  const ws = wb.Sheets[SH_REQUESTS];
  if (!ws) return [];
  return XLSX.utils.sheet_to_json(ws, { defval: "", cellDates: true }).map((row) => ({
    id:            String(row["Request ID"]    ?? "").trim(),
    patientId:     String(row["Patient ID"]    ?? "").trim(),
    patientName:   String(row["Patient Name"]  ?? "").trim(),
    contact:       String(row["Contact"]       ?? "").trim(),
    age:           String(row["Age"]           ?? "").trim(),
    requestedDate: fromExcelDate(row["Requested Date"]),
    requestedSlot: String(row["Requested Slot"] ?? "").trim(),
    requestedOn:   fromExcelDate(row["Requested On"]),
  })).filter((r) => r.id);
}

function parseScheduled(wb) {
  const ws = wb.Sheets[SH_SCHEDULED];
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
  const ws = wb.Sheets[SH_PAST];
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

// Move past-due scheduled appointments into the past sheet automatically
function migratePastAppointments(scheduled, past) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const stillScheduled = [];
  const newPast        = [...past];

  for (const appt of scheduled) {
    const d = toDate(appt.appointmentDate);
    if (d && d < today) {
      if (!newPast.find((p) => p.id === appt.id)) newPast.push(appt);
    } else {
      stillScheduled.push(appt);
    }
  }

  return { scheduled: stillScheduled, past: newPast };
}

function saveAppointments(requests, scheduled, past) {
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

// GET all appointments (runs migration on load)
app.get("/api/appointments", (req, res) => {
  try {
    const wb = readAppointmentsWorkbook();
    if (!wb) return res.json({ requests: [], scheduled: [], past: [] });

    let requests  = parseRequests(wb);
    let scheduled = parseScheduled(wb);
    let past      = parsePast(wb);

    const migrated = migratePastAppointments(scheduled, past);
    if (migrated.scheduled.length !== scheduled.length) {
      saveAppointments(requests, migrated.scheduled, migrated.past);
      scheduled = migrated.scheduled;
      past      = migrated.past;
    }

    res.json({ requests, scheduled, past });
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

    requests  = requests.filter((r) => r.id !== requestId);
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

    const exists = scheduled.find((s) => s.id === appointmentId);
    if (!exists) return res.status(404).json({ error: "Appointment not found" });

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

// ─── FIX: Cancel a scheduled appointment (removes it permanently) ─────────────
// This endpoint was MISSING — the context called it but got a 404 every time,
// so the appointment was never actually removed from the Excel file or the UI.
app.post("/api/appointments/cancel", (req, res) => {
  try {
    const { appointmentId } = req.body;
    if (!appointmentId) return res.status(400).json({ error: "appointmentId is required" });

    const wb = readAppointmentsWorkbook();

    let requests  = wb ? parseRequests(wb)  : [];
    let scheduled = wb ? parseScheduled(wb) : [];
    let past      = wb ? parsePast(wb)      : [];

    const exists = scheduled.find((s) => s.id === appointmentId);
    if (!exists) return res.status(404).json({ error: "Appointment not found" });

    // Simply remove from scheduled — cancelled appointments do NOT go to past
    scheduled = scheduled.filter((s) => s.id !== appointmentId);

    const result = saveAppointments(requests, scheduled, past);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("POST /api/appointments/cancel:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── FIX: Add a new appointment directly to scheduled ─────────────────────────
// This endpoint was MISSING — the "Add Appointment" button in ScheduledAppointments
// called it but got a 404, so nothing was ever added.
app.post("/api/appointments/add", (req, res) => {
  try {
    const { appointment } = req.body;
    if (!appointment) return res.status(400).json({ error: "appointment object is required" });
    if (!appointment.patientName) return res.status(400).json({ error: "patientName is required" });
    if (!appointment.appointmentDate) return res.status(400).json({ error: "appointmentDate is required" });
    if (!appointment.appointmentTime) return res.status(400).json({ error: "appointmentTime is required" });

    const wb = readAppointmentsWorkbook();

    let requests  = wb ? parseRequests(wb)  : [];
    let scheduled = wb ? parseScheduled(wb) : [];
    let past      = wb ? parsePast(wb)      : [];

    const newAppt = {
      id:              `APT-${Date.now()}`,
      patientId:       appointment.patientId       || "",
      patientName:     appointment.patientName,
      contact:         appointment.contact         || "",
      age:             appointment.age             || "",
      appointmentDate: appointment.appointmentDate,
      appointmentTime: appointment.appointmentTime,
    };

    scheduled = [...scheduled, newAppt];

    const result = saveAppointments(requests, scheduled, past);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("POST /api/appointments/add:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST save all appointments (bulk update)
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

// ─────────────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Portal API running on http://localhost:${PORT}`);
  console.log(`📄 Patients:     ${PATIENTS_FILE}`);
  console.log(`📄 Appointments: ${APPOINTMENTS_FILE}`);
});