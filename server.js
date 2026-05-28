// server.js  (place this in your project ROOT, next to package.json)
//
// Tiny Express API that keeps maternal-portal-data.xlsx on disk.
// Vite runs on :5173, this server runs on :3001.
// The Vite proxy (vite.config.js) forwards /api/* to this server,
// so the React app just calls fetch("/api/...") — no CORS issues.

import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = 3001;

// The Excel file lives at project root. Change this path if you want it elsewhere.
const DATA_FILE = path.join(__dirname, "maternal-portal-data.xlsx");

app.use(express.json());

// ─── Sheet names (must match what the frontend expects) ───────────────────────
const SHEET_PATIENTS  = "Patients";
const SHEET_TEMPLATES = "Templates";

// ─── Helper: read workbook from disk ─────────────────────────────────────────
function readWorkbook() {
  if (!fs.existsSync(DATA_FILE)) return null;
  return XLSX.readFile(DATA_FILE);
}

// ─── Helper: write workbook to disk ──────────────────────────────────────────
function writeWorkbook(wb) {
  XLSX.writeFile(wb, DATA_FILE);
}

// ─── Helper: build a fresh workbook from patients + templates arrays ──────────
function buildWorkbook(patients, templates) {
  const wb = XLSX.utils.book_new();

  const patientRows = patients.map((p) => ({
    "Patient ID":     p.id,
    "Name":           p.name,
    "Contact":        p.contact,
    "Due Date":       p.dueDate === "N/A" ? "" : p.dueDate,
    "Last Week Sent": p.lastWeekSent === "N/A" ? "" : p.lastWeekSent,
    "Active":         p.active ? "true" : "false",
  }));
  const wsP = XLSX.utils.json_to_sheet(patientRows);
  wsP["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, wsP, SHEET_PATIENTS);

  const templateRows = templates.map((t) => ({
    "Week":    t.week,
    "Message": t.message,
  }));
  const wsT = XLSX.utils.json_to_sheet(templateRows);
  wsT["!cols"] = [{ wch: 6 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsT, SHEET_TEMPLATES);

  return wb;
}

// ─── GET /api/data — load everything from Excel ───────────────────────────────
app.get("/api/data", (req, res) => {
  const wb = readWorkbook();

  if (!wb) {
    // No file yet — return empty data; the frontend will use defaults
    return res.json({ exists: false, patients: [], templates: [] });
  }

  // Parse Patients sheet
  const wsP = wb.Sheets[SHEET_PATIENTS];
  const patients = wsP
    ? XLSX.utils.sheet_to_json(wsP, { defval: "" }).map((row) => ({
        id:           String(row["Patient ID"] ?? "").trim(),
        name:         String(row["Name"]           ?? "").trim(),
        contact:      String(row["Contact"]        ?? "").trim(),
        dueDate:      String(row["Due Date"]       ?? "").trim() || "N/A",
        lastWeekSent: row["Last Week Sent"] === "" || row["Last Week Sent"] == null
                        ? "N/A"
                        : Number(row["Last Week Sent"]),
        active:       String(row["Active"]).toLowerCase() === "true" ||
                      row["Active"] === true ||
                      row["Active"] === 1,
      })).filter((p) => p.id)
    : [];

  // Parse Templates sheet
  const wsT = wb.Sheets[SHEET_TEMPLATES];
  const templateMap = {};
  if (wsT) {
    XLSX.utils.sheet_to_json(wsT, { defval: "" }).forEach((row) => {
      const week = Number(row["Week"]);
      if (week >= 1 && week <= 40) templateMap[week] = String(row["Message"] ?? "").trim();
    });
  }
  const templates = Array.from({ length: 40 }, (_, i) => {
    const w = i + 1;
    return { week: w, message: templateMap[w] || `Week ${w} — Please add the health guidance message for this week.` };
  });

  res.json({ exists: true, patients, templates });
});

// ─── POST /api/patients — save the full patients array ───────────────────────
app.post("/api/patients", (req, res) => {
  try {
    const { patients } = req.body;
    if (!Array.isArray(patients)) return res.status(400).json({ error: "patients must be an array" });

    // Read existing workbook to preserve Templates sheet
    let wb = readWorkbook();
    let templates = [];

    if (wb && wb.Sheets[SHEET_TEMPLATES]) {
      const templateMap = {};
      XLSX.utils.sheet_to_json(wb.Sheets[SHEET_TEMPLATES], { defval: "" }).forEach((row) => {
        const week = Number(row["Week"]);
        if (week >= 1 && week <= 40) templateMap[week] = String(row["Message"] ?? "");
      });
      templates = Array.from({ length: 40 }, (_, i) => {
        const w = i + 1;
        return { week: w, message: templateMap[w] || "" };
      });
    }

    const newWb = buildWorkbook(patients, templates);
    writeWorkbook(newWb);
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/patients error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/templates — save the full templates array ─────────────────────
app.post("/api/templates", (req, res) => {
  try {
    const { templates } = req.body;
    if (!Array.isArray(templates)) return res.status(400).json({ error: "templates must be an array" });

    // Read existing workbook to preserve Patients sheet
    let wb = readWorkbook();
    let patients = [];

    if (wb && wb.Sheets[SHEET_PATIENTS]) {
      patients = XLSX.utils.sheet_to_json(wb.Sheets[SHEET_PATIENTS], { defval: "" })
        .map((row) => ({
          id:           String(row["Patient ID"] ?? "").trim(),
          name:         String(row["Name"]       ?? "").trim(),
          contact:      String(row["Contact"]    ?? "").trim(),
          dueDate:      String(row["Due Date"]   ?? "").trim() || "N/A",
          lastWeekSent: row["Last Week Sent"] === "" ? "N/A" : Number(row["Last Week Sent"]),
          active:       String(row["Active"]).toLowerCase() === "true",
        })).filter((p) => p.id);
    }

    const newWb = buildWorkbook(patients, templates);
    writeWorkbook(newWb);
    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/templates error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Maternal Portal API running on http://localhost:${PORT}`);
  console.log(`📄 Excel file: ${DATA_FILE}`);
});