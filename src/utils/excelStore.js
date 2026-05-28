// src/utils/excelStore.js
//
// Utilities to read and write the maternal-portal Excel workbook.
// The workbook has two sheets:
//   "Patients"  — patient records
//   "Templates" — weekly message templates
//
// Uses the `xlsx` library (SheetJS), already in package.json.

import * as XLSX from "xlsx";

// ─── Sheet names ──────────────────────────────────────────────────────────────
export const SHEET_PATIENTS  = "Patients";
export const SHEET_TEMPLATES = "Templates";

// ─── Expected column headers ──────────────────────────────────────────────────
// Patients sheet columns (exact header names in the Excel file):
//   Patient ID | Name | Contact | Due Date | Last Week Sent | Active
//
// Templates sheet columns:
//   Week | Message

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Reads an ArrayBuffer (from a FileReader) and returns:
 *   { patients: [...], templates: [...] }
 *
 * Each patient object: { id, name, contact, dueDate, lastWeekSent, active }
 * Each template object: { week, message }
 */
export function parseWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: "array" });

  const patients  = readPatients(wb);
  const templates = readTemplates(wb);

  return { patients, templates };
}

function readPatients(wb) {
  const ws = wb.Sheets[SHEET_PATIENTS];
  if (!ws) return [];

  // header:1 returns an array of arrays; we map manually for robustness
  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  return rows.map((row) => ({
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
  })).filter((p) => p.id); // drop empty rows
}

function readTemplates(wb) {
  const ws = wb.Sheets[SHEET_TEMPLATES];
  if (!ws) return buildDefaultTemplates();

  const rows = XLSX.utils.sheet_to_json(ws, { defval: "" });

  // Build a map week→message from the sheet
  const map = {};
  rows.forEach((row) => {
    const week = Number(row["Week"]);
    if (week >= 1 && week <= 40) {
      map[week] = String(row["Message"] ?? "").trim();
    }
  });

  // Fill all 40 weeks (use sheet value or generic placeholder)
  return Array.from({ length: 40 }, (_, i) => {
    const w = i + 1;
    return {
      week: w,
      message: map[w] ||
        `Week ${w} — Please add the health guidance message for this week.`,
    };
  });
}

// ─── WRITE ────────────────────────────────────────────────────────────────────

/**
 * Builds an updated workbook from current state and triggers a browser download.
 *
 * @param {Array} patients  — current patients array
 * @param {Array} templates — current templates array (all 40 weeks)
 * @param {string} filename — default "maternal-portal-data.xlsx"
 */
export function saveWorkbook(patients, templates, filename = "maternal-portal-data.xlsx") {
  const wb = XLSX.utils.book_new();

  // ── Patients sheet ──────────────────────────────────────────────────────────
  const patientRows = patients.map((p) => ({
    "Patient ID":     p.id,
    "Name":           p.name,
    "Contact":        p.contact,
    "Due Date":       p.dueDate === "N/A" ? "" : p.dueDate,
    "Last Week Sent": p.lastWeekSent === "N/A" ? "" : p.lastWeekSent,
    "Active":         p.active ? "true" : "false",
  }));
  const wsPatients = XLSX.utils.json_to_sheet(patientRows);
  // Set column widths for readability
  wsPatients["!cols"] = [
    { wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 8 },
  ];
  XLSX.utils.book_append_sheet(wb, wsPatients, SHEET_PATIENTS);

  // ── Templates sheet ─────────────────────────────────────────────────────────
  const templateRows = templates.map((t) => ({
    "Week":    t.week,
    "Message": t.message,
  }));
  const wsTemplates = XLSX.utils.json_to_sheet(templateRows);
  wsTemplates["!cols"] = [{ wch: 6 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsTemplates, SHEET_TEMPLATES);

  // Trigger download
  XLSX.writeFile(wb, filename);
}

// ─── CREATE BLANK WORKBOOK ────────────────────────────────────────────────────
/**
 * Generates and downloads a blank starter Excel file with correct headers
 * and sample rows — so users have the right format to fill in.
 */
export function downloadStarterWorkbook() {
  const samplePatients = [
    {
      "Patient ID":     "P-101",
      "Name":           "Priya Sharma",
      "Contact":        "9876543210",
      "Due Date":       "12/08/25",
      "Last Week Sent": 22,
      "Active":         "true",
    },
    {
      "Patient ID":     "P-102",
      "Name":           "Sunita Rao",
      "Contact":        "9123456780",
      "Due Date":       "05/09/25",
      "Last Week Sent": 18,
      "Active":         "true",
    },
  ];

  const defaultTemplates = buildDefaultTemplates().map((t) => ({
    "Week":    t.week,
    "Message": t.message,
  }));

  const wb = XLSX.utils.book_new();

  const wsP = XLSX.utils.json_to_sheet(samplePatients);
  wsP["!cols"] = [{ wch: 12 }, { wch: 24 }, { wch: 14 }, { wch: 12 }, { wch: 16 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, wsP, SHEET_PATIENTS);

  const wsT = XLSX.utils.json_to_sheet(defaultTemplates);
  wsT["!cols"] = [{ wch: 6 }, { wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsT, SHEET_TEMPLATES);

  XLSX.writeFile(wb, "maternal-portal-data.xlsx");
}

// ─── Default templates (used when no file is loaded yet) ─────────────────────
const BASE_TEMPLATES = {
  1:  "Welcome to your pregnancy journey! Stay hydrated, take your prenatal vitamins, and schedule your first antenatal visit as soon as possible.",
  4:  "By week 4, the embryo has implanted in your uterus. You may start experiencing early symptoms like fatigue or mild nausea. Rest well and avoid alcohol and smoking.",
  8:  "Your baby is about the size of a kidney bean! Major organs are forming. Continue taking folic acid and report any heavy bleeding to your doctor immediately.",
  12: "You've reached the end of your first trimester — congratulations! Your baby is now developing facial features and tiny fingers. The risk of miscarriage drops significantly after this week.",
  16: "Your baby can now make sucking motions and may start to hear sounds. You might start feeling the first flutters of movement soon. Make sure to attend your mid-pregnancy scan.",
  20: "Halfway there! Your baby is about 25 cm long. This is typically when you'll have your anatomy scan. Keep up your iron intake to prevent anaemia.",
  24: "Your baby's lungs are developing rapidly. Now is a good time to start thinking about birth plans and antenatal classes.",
  28: "You've entered the third trimester. Your baby's eyes can now open and close. Watch for signs of preeclampsia such as severe headaches or swelling in your hands and face.",
  32: "Your baby is gaining weight quickly and preparing for birth. Practice your breathing exercises.",
  36: "Your baby is nearly full-term. Pack your hospital bag and make sure your support person is ready.",
  40: "Your due date has arrived! Contact your healthcare provider if you experience strong contractions, water breaking, or reduced fetal movement.",
};

export function buildDefaultTemplates() {
  return Array.from({ length: 40 }, (_, i) => {
    const w = i + 1;
    return {
      week: w,
      message: BASE_TEMPLATES[w] ||
        `Week ${w} — Please add the health guidance message for this week. Include tips on nutrition, common symptoms, and when to contact your doctor.`,
    };
  });
}