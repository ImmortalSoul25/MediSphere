// src/pages/appointments/PastAppointments.jsx

import { useState, useMemo } from "react";
import { CalendarX, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { useAppointments } from "../../context/AppointmentsContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str || str === "") return "—";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

function fmtTime(str) {
  if (!str || str === "") return "—";
  return str;
}

// ─── Sort button ──────────────────────────────────────────────────────────────
function SortButton({ sortKey, currentKey, sortDir, label, onClick }) {
  const active = currentKey === sortKey;
  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
        border transition whitespace-nowrap
        ${active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
        }`}
    >
      {active
        ? sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        : <ArrowUpDown size={12} className="text-slate-400" />
      }
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function PastAppointments() {
  const { past, loading } = useAppointments();

  const [query,   setQuery]   = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc"); // most recent first by default

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const displayed = useMemo(() => {
    let list = [...(past || [])];

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((a) =>
        a.patientName.toLowerCase().includes(q) ||
        (a.patientId  && a.patientId.toLowerCase().includes(q)) ||
        (a.contact    && a.contact.includes(q))
      );
    }

    // Sort
    list.sort((a, b) => {
      let av, bv;
      if (sortKey === "date") {
        av = a.appointmentDate ? new Date(a.appointmentDate) : new Date(0);
        bv = b.appointmentDate ? new Date(b.appointmentDate) : new Date(0);
        return sortDir === "asc" ? av - bv : bv - av;
      }
      if (sortKey === "name") {
        av = a.patientName.toLowerCase();
        bv = b.patientName.toLowerCase();
      }
      if (sortKey === "id") {
        av = parseInt(a.patientId, 10) || 0;
        bv = parseInt(b.patientId, 10) || 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    return list;
  }, [past, query, sortKey, sortDir]);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Past Appointments</h1>
        <p className="mt-1 text-slate-500">
          A record of all completed appointments. Appointments are moved here automatically once their date has passed.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl
                       bg-white shadow-sm text-slate-700 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-indigo-400
                       focus:border-transparent transition"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <ArrowUpDown size={12} /> Sort:
          </span>
          <SortButton sortKey="date" currentKey={sortKey} sortDir={sortDir} label="Date"       onClick={handleSort} />
          <SortButton sortKey="name" currentKey={sortKey} sortDir={sortDir} label="Name"       onClick={handleSort} />
          <SortButton sortKey="id"   currentKey={sortKey} sortDir={sortDir} label="Patient ID" onClick={handleSort} />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-semibold">Patient ID</th>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Age</th>
                <th className="px-5 py-3 font-semibold">Appointment Date</th>
                <th className="px-5 py-3 font-semibold">Appointment Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Loading past appointments…
                  </td>
                </tr>
              ) : displayed.length > 0 ? (
                displayed.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">
                      {appt.patientId || "—"}
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{appt.patientName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{appt.contact}</td>
                    <td className="px-5 py-3.5 text-slate-600">{appt.age || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(appt.appointmentDate)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtTime(appt.appointmentTime)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-full">
                        <CalendarX size={28} className="text-slate-400" />
                      </div>
                      <p className="text-slate-400 text-sm">
                        {query
                          ? `No past appointments match "${query}".`
                          : "No past appointments yet."}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          Showing {displayed.length} of {past?.length ?? 0} past appointments
        </div>
      </div>
    </div>
  );
}