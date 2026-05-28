// src/pages/Logs.jsx
//
// Audit Log page — shows a chronological record of all actions taken
// in the portal: messages sent/failed, patients added, templates edited, etc.
//
// Features:
//   - Search by patient name, ID, or action description
//   - Filter by action category (All, Message, Patient, Template, Risk)
//   - Filter by status (All, Success, Failed, Pending, Info)
//   - Summary bar showing counts per status

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";

// ─── Dummy Audit Log Data ─────────────────────────────────────────────────────
// In a real app this would come from a backend API.
// Each entry has:
//   id        — unique row id
//   timestamp — when it happened
//   category  — type of action (Message / Patient / Template / Risk)
//   action    — short description of what happened
//   actor     — who performed the action (staff name or "System")
//   patientId — related patient (null if not patient-specific)
//   patient   — related patient name (null if not applicable)
//   status    — Success / Failed / Pending / Info

const DUMMY_LOGS = [
  {
    id: 1,
    timestamp: "27/05/2025 09:14",
    category: "Message",
    action: "Week 22 WhatsApp message sent",
    actor: "System",
    patientId: "P-204",
    patient: "Priya Sharma",
    status: "Success",
  },
  {
    id: 2,
    timestamp: "27/05/2025 09:10",
    category: "Message",
    action: "Week 18 WhatsApp message failed to deliver",
    actor: "System",
    patientId: "P-198",
    patient: "Usha Krishnan",
    status: "Failed",
  },
  {
    id: 3,
    timestamp: "27/05/2025 08:55",
    category: "Patient",
    action: "New patient added to portal",
    actor: "Dr. Meera Joshi",
    patientId: "P-214",
    patient: "Fatima Sheikh",
    status: "Info",
  },
  {
    id: 4,
    timestamp: "27/05/2025 08:40",
    category: "Template",
    action: "Week 18 message template updated",
    actor: "Dr. Meera Joshi",
    patientId: null,
    patient: null,
    status: "Info",
  },
  {
    id: 5,
    timestamp: "27/05/2025 08:30",
    category: "Risk",
    action: "Patient marked as High Risk",
    actor: "Dr. Meera Joshi",
    patientId: "P-102",
    patient: "Sunita Rao",
    status: "Info",
  },
  {
    id: 6,
    timestamp: "26/05/2025 17:22",
    category: "Message",
    action: "Bulk Week 30 messages sent to 14 patients",
    actor: "System",
    patientId: null,
    patient: null,
    status: "Success",
  },
  {
    id: 7,
    timestamp: "26/05/2025 16:05",
    category: "Message",
    action: "Week 30 WhatsApp message delivery pending",
    actor: "System",
    patientId: "P-109",
    patient: "Lakshmi Varma",
    status: "Pending",
  },
  {
    id: 8,
    timestamp: "26/05/2025 14:50",
    category: "Patient",
    action: "Patient contact number updated",
    actor: "Dr. Meera Joshi",
    patientId: "P-105",
    patient: "Meena Pillai",
    status: "Info",
  },
  {
    id: 9,
    timestamp: "26/05/2025 13:30",
    category: "Template",
    action: "Week 12 message template updated",
    actor: "Dr. Meera Joshi",
    patientId: null,
    patient: null,
    status: "Info",
  },
  {
    id: 10,
    timestamp: "26/05/2025 11:15",
    category: "Message",
    action: "Week 36 WhatsApp message sent",
    actor: "System",
    patientId: "P-103",
    patient: "Anita Desai",
    status: "Success",
  },
  {
    id: 11,
    timestamp: "26/05/2025 10:00",
    category: "Patient",
    action: "Patient marked as inactive",
    actor: "Dr. Meera Joshi",
    patientId: "P-104",
    patient: "Kavitha Nair",
    status: "Info",
  },
  {
    id: 12,
    timestamp: "25/05/2025 16:45",
    category: "Message",
    action: "Week 8 WhatsApp message failed to deliver",
    actor: "System",
    patientId: "P-110",
    patient: "Usha Krishnan",
    status: "Failed",
  },
  {
    id: 13,
    timestamp: "25/05/2025 15:20",
    category: "Risk",
    action: "High Risk flag removed after review",
    actor: "Dr. Meera Joshi",
    patientId: "P-107",
    patient: "Rekha Iyer",
    status: "Info",
  },
  {
    id: 14,
    timestamp: "25/05/2025 12:00",
    category: "Message",
    action: "Week 24 WhatsApp message sent",
    actor: "System",
    patientId: "P-108",
    patient: "Fatima Sheikh",
    status: "Success",
  },
  {
    id: 15,
    timestamp: "25/05/2025 09:30",
    category: "Template",
    action: "Week 40 message template created",
    actor: "Dr. Meera Joshi",
    patientId: null,
    patient: null,
    status: "Info",
  },
];

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    Success: "bg-green-100 text-green-700",
    Failed:  "bg-red-100 text-red-600",
    Pending: "bg-amber-100 text-amber-600",
    Info:    "bg-blue-100 text-blue-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

// ─── Category Badge ───────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const map = {
    Message:  "bg-indigo-50 text-indigo-600",
    Patient:  "bg-teal-50 text-teal-600",
    Template: "bg-purple-50 text-purple-600",
    Risk:     "bg-rose-50 text-rose-600",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${map[category] || "bg-slate-100 text-slate-500"}`}>
      {category}
    </span>
  );
}

// ─── Summary Count Card ───────────────────────────────────────────────────────
function SummaryCard({ label, count, color }) {
  const colorMap = {
    green: "bg-green-50 text-green-700 border-green-100",
    red:   "bg-red-50 text-red-600 border-red-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    blue:  "bg-blue-50 text-blue-600 border-blue-100",
    slate: "bg-slate-50 text-slate-600 border-slate-200",
  };
  return (
    <div className={`flex flex-col items-center justify-center px-5 py-3 rounded-xl border text-sm ${colorMap[color]}`}>
      <span className="text-2xl font-bold">{count}</span>
      <span className="text-xs font-medium mt-0.5">{label}</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Logs() {
  const [query, setQuery]           = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter]     = useState("All");

  const categories = ["All", "Message", "Patient", "Template", "Risk"];
  const statuses   = ["All", "Success", "Failed", "Pending", "Info"];

  // ── Filter logic ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return DUMMY_LOGS.filter((log) => {
      const q = query.toLowerCase();

      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        (log.patient && log.patient.toLowerCase().includes(q)) ||
        (log.patientId && log.patientId.toLowerCase().includes(q)) ||
        log.actor.toLowerCase().includes(q);

      const matchesCategory =
        categoryFilter === "All" || log.category === categoryFilter;

      const matchesStatus =
        statusFilter === "All" || log.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [query, categoryFilter, statusFilter]);

  // ── Summary counts (based on filtered results) ──────────────────────────────
  const counts = useMemo(() => ({
    total:   filtered.length,
    success: filtered.filter((l) => l.status === "Success").length,
    failed:  filtered.filter((l) => l.status === "Failed").length,
    pending: filtered.filter((l) => l.status === "Pending").length,
    info:    filtered.filter((l) => l.status === "Info").length,
  }), [filtered]);

  return (
    <div>
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Audit Logs
        </h1>
        <p className="mt-1 text-slate-500">
          A complete record of all actions performed in the portal.
        </p>
      </div>

      {/* ── Summary bar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 mb-6">
        <SummaryCard label="Total"   count={counts.total}   color="slate" />
        <SummaryCard label="Success" count={counts.success} color="green" />
        <SummaryCard label="Failed"  count={counts.failed}  color="red"   />
        <SummaryCard label="Pending" count={counts.pending} color="amber" />
        <SummaryCard label="Info"    count={counts.info}    color="blue"  />
      </div>

      {/* ── Filters row ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by action, patient, or staff…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl
                       bg-white shadow-sm text-slate-700 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          />
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 flex-shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white
                       text-slate-700 shadow-sm focus:outline-none focus:ring-2
                       focus:ring-indigo-400 focus:border-transparent transition"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>
            ))}
          </select>
        </div>

        {/* Status filter */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white
                       text-slate-700 shadow-sm focus:outline-none focus:ring-2
                       focus:ring-indigo-400 focus:border-transparent transition"
          >
            {statuses.map((s) => (
              <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>
            ))}
          </select>
        </div>

      </div>

      {/* ── Log table ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">

            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-5 py-3 font-semibold">Category</th>
                <th className="px-5 py-3 font-semibold">Action</th>
                <th className="px-5 py-3 font-semibold">Patient</th>
                <th className="px-5 py-3 font-semibold">Performed By</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors duration-100">

                    {/* Timestamp */}
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap font-mono">
                      {log.timestamp}
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5">
                      <CategoryBadge category={log.category} />
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      {log.action}
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      {log.patient ? (
                        <div>
                          <p className="text-slate-700 font-medium">{log.patient}</p>
                          <p className="text-slate-400 text-xs font-mono">{log.patientId}</p>
                        </div>
                      ) : (
                        <span className="text-slate-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Actor */}
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">
                      {log.actor}
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <StatusBadge status={log.status} />
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    No log entries match your current filters.
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

        {/* Row count footer */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          Showing {filtered.length} of {DUMMY_LOGS.length} entries
        </div>
      </div>
    </div>
  );
}