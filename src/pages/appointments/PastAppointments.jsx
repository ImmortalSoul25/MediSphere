// src/pages/appointments/PastAppointments.jsx

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarX, Search, ArrowUp, ArrowDown, ArrowUpDown, CalendarDays, CalendarCheck, Eye, FileText, Ban, AlertCircle, X } from "lucide-react";
import { useAppointments } from "../../context/AppointmentsContext";
import { useData } from "../../context/DataContext";
import { ViewDetailsModal, PatientForm, EMPTY_FORM } from "../Patients";

const APPT_TYPE_STYLES = {
  "First Consultation": "bg-violet-50 text-violet-700",
  "Follow Up": "bg-teal-50 text-teal-700",
  "Surgery": "bg-rose-50 text-rose-700",
  "Routine Check": "bg-sky-50 text-sky-700",
  "Other": "bg-amber-50 text-amber-700",
};

function ApptTypeBadge({ type }) {
  if (!type) return <span className="text-slate-300 text-xs">-</span>;
  const style = APPT_TYPE_STYLES[type] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {type}
    </span>
  );
}

function NotesModal({ appointment, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Appointment Notes</h2>
            <p className="text-xs text-slate-400 mt-0.5">{appointment.patientName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {appointment.notes || "No notes available."}
          </p>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const { patients, addPatient } = useData();
  const navigate = useNavigate();
  const [modal, setModal] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(null);

  const [query,   setQuery]   = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortDir, setSortDir] = useState("desc"); // most recent first by default

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleViewPatient = (appointment) => {
    const isExisting = patients.find(p => String(p.id) === String(appointment.patientId));
    if (isExisting) {
      navigate(`/patients/${appointment.patientId}`);
    } else {
      setModal({ type: "unknown_patient", request: appointment });
    }
  };

  const handleAddNewPatient = (appointment) => {
    setShowAddPatient({
      ...EMPTY_FORM,
      name: appointment.patientName || "",
      number: appointment.contact || "",
    });
    setModal(null);
  };

  const handleSaveNewPatient = async (data) => {
    await addPatient(data);
    setShowAddPatient(null);
  };

  const stats = useMemo(() => {
    if (!past) return { total: 0, thisMonth: 0, thisWeek: 0 };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0,0,0,0);
    let thisMonth = 0;
    let thisWeek = 0;
    past.forEach(a => {
      if (!a.appointmentDate) return;
      const d = new Date(a.appointmentDate);
      if (d >= startOfMonth) thisMonth++;
      if (d >= startOfWeek) thisWeek++;
    });
    return { total: past.length, thisMonth, thisWeek };
  }, [past]);

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

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Past Appointments</h1>
        <p className="mt-1 text-slate-500">
          A record of all completed appointments.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-indigo-50 p-3 rounded-xl"><CalendarDays size={24} className="text-indigo-600" /></div>
          <div><p className="text-sm font-medium text-slate-500">Total Appointments</p><h3 className="text-2xl font-bold text-slate-800">{stats.total}</h3></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-teal-50 p-3 rounded-xl"><CalendarDays size={24} className="text-teal-600" /></div>
          <div><p className="text-sm font-medium text-slate-500">This Month</p><h3 className="text-2xl font-bold text-slate-800">{stats.thisMonth}</h3></div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl"><CalendarCheck size={24} className="text-blue-600" /></div>
          <div><p className="text-sm font-medium text-slate-500">This Week</p><h3 className="text-2xl font-bold text-slate-800">{stats.thisWeek}</h3></div>
        </div>
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
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-5 py-3 font-semibold">Day</th>
                <th className="px-5 py-3 font-semibold">Time</th>
                <th className="px-5 py-3 font-semibold">Appt Type</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>

            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Loading past appointments…
                  </td>
                </tr>
              ) : displayed.length > 0 ? (
                displayed.map((appt) => (

                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{appt.patientId || "—"}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{appt.patientName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{appt.contact}</td>
                    <td className="px-5 py-3.5 text-slate-600">{appt.age || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(appt.appointmentDate)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{appt.appointment_day || "-"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtTime(appt.appointmentTime)}</td>
                    <td className="px-5 py-3.5"><ApptTypeBadge type={appt.appointmentType} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          title="View Patient Details"
                          onClick={() => handleViewPatient(appt)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          title="View Notes"
                          onClick={() => setModal({ type: "notes", appointment: appt })}
                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <FileText size={16} />
                        </button>
                      </div>
                    </td>
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
      {modal?.type === "notes" && <NotesModal appointment={modal.appointment} onClose={() => setModal(null)} />}

      {modal?.type === "unknown_patient" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5 text-center">
              <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={24} className="text-amber-500" />
              </div>
              <h2 className="text-base font-bold text-slate-800 mb-1">Patient Not Found</h2>
              <p className="text-sm text-slate-500">
                This patient hasn't been added yet. Add them as a new patient to view and manage their full details.
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={() => handleAddNewPatient(modal.request)} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition">
                Add as New Patient
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPatient && (
        <PatientForm
          initialData={showAddPatient}
          onClose={() => setShowAddPatient(null)}
          onSave={handleSaveNewPatient}
        />
      )}
    </div>
  );
}