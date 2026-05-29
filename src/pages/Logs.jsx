// src/pages/Logs.jsx

import { useState, useMemo } from "react";
import { Search, Filter } from "lucide-react";

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
// Logs are empty for now — they will be populated when real message sending is wired up.
const LOGS = [];

export default function Logs() {
  const [query,          setQuery]          = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter,   setStatusFilter]   = useState("All");

  const categories = ["All", "Message", "Patient", "Template", "Risk"];
  const statuses   = ["All", "Success", "Failed", "Pending", "Info"];

  const filtered = useMemo(() => {
    return LOGS.filter((log) => {
      const q = query.toLowerCase();
      const matchesSearch =
        !q ||
        log.action.toLowerCase().includes(q) ||
        (log.patient   && log.patient.toLowerCase().includes(q)) ||
        (log.patientId && log.patientId.toLowerCase().includes(q)) ||
        log.actor.toLowerCase().includes(q);
      const matchesCategory = categoryFilter === "All" || log.category === categoryFilter;
      const matchesStatus   = statusFilter   === "All" || log.status   === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [query, categoryFilter, statusFilter]);

  const counts = useMemo(() => ({
    total:   filtered.length,
    success: filtered.filter((l) => l.status === "Success").length,
    failed:  filtered.filter((l) => l.status === "Failed").length,
    pending: filtered.filter((l) => l.status === "Pending").length,
    info:    filtered.filter((l) => l.status === "Info").length,
  }), [filtered]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Audit Logs</h1>
        <p className="mt-1 text-slate-500">A complete record of all actions performed in the portal.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <SummaryCard label="Total"   count={counts.total}   color="slate" />
        <SummaryCard label="Success" count={counts.success} color="green" />
        <SummaryCard label="Failed"  count={counts.failed}  color="red"   />
        <SummaryCard label="Pending" count={counts.pending} color="amber" />
        <SummaryCard label="Info"    count={counts.info}    color="blue"  />
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
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
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-slate-400 flex-shrink-0" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white
                       text-slate-700 shadow-sm focus:outline-none focus:ring-2
                       focus:ring-indigo-400 focus:border-transparent transition"
          >
            {categories.map((c) => <option key={c} value={c}>{c === "All" ? "All Categories" : c}</option>)}
          </select>
        </div>
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2.5 bg-white
                       text-slate-700 shadow-sm focus:outline-none focus:ring-2
                       focus:ring-indigo-400 focus:border-transparent transition"
          >
            {statuses.map((s) => <option key={s} value={s}>{s === "All" ? "All Statuses" : s}</option>)}
          </select>
        </div>
      </div>

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
                    <td className="px-5 py-3.5 text-slate-500 text-xs whitespace-nowrap font-mono">{log.timestamp}</td>
                    <td className="px-5 py-3.5"><CategoryBadge category={log.category} /></td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">{log.action}</td>
                    <td className="px-5 py-3.5">
                      {log.patient ? (
                        <div>
                          <p className="text-slate-700 font-medium">{log.patient}</p>
                          <p className="text-slate-400 text-xs font-mono">{log.patientId}</p>
                        </div>
                      ) : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 whitespace-nowrap">{log.actor}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={log.status} /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-slate-400 text-sm">
                    No log entries yet. Logs will appear here once messages are sent.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          Showing {filtered.length} entries
        </div>
      </div>
    </div>
  );
}