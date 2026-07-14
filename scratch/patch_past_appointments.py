import re

file_path = 'src/pages/appointments/PastAppointments.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix imports
content = re.sub(r'import { useState, useMemo } from "react";', r'import { useState, useMemo } from "react";\nimport { useNavigate } from "react-router-dom";', content)
content = re.sub(r'import { CalendarX, Search, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";', r'import { CalendarX, Search, ArrowUp, ArrowDown, ArrowUpDown, CalendarDays, CalendarCheck, Eye, FileText, Ban, AlertCircle, X } from "lucide-react";', content)

# Add ApptTypeBadge and Modals
badge_and_modals_code = """
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
            {appointment.appointmentNotes || "No notes available."}
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
"""
content = re.sub(r'// ─── Helpers ──────────────────────────────────────────────────────────────────', badge_and_modals_code + '\n// ─── Helpers ──────────────────────────────────────────────────────────────────', content)

# Add hooks
content = re.sub(r'export default function PastAppointments\(\) {\n  const { past, loading } = useAppointments\(\);', r'export default function PastAppointments() {\n  const { past, loading } = useAppointments();\n  const navigate = useNavigate();\n  const [modal, setModal] = useState(null);\n', content)

# Add Stats
stats_code = """
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
"""
content = re.sub(r'  const displayed = useMemo\(\(\) => \{', stats_code + '\n  const displayed = useMemo(() => {', content)

# Add Stats to UI
stats_ui = """
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
"""
content = re.sub(r'      \{\/\* Header \*\/.*?<\/div>', stats_ui, content, flags=re.DOTALL)

# Modify Table Headers
headers = """
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
"""
content = re.sub(r'              <tr>.*?<\/tr>', headers, content, count=1, flags=re.DOTALL)

# Modify Table Rows
rows = """
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
                          onClick={() => navigate(`/patients/${appt.patientId}`)}
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
"""
content = re.sub(r'                  <tr key=\{appt.id\}.*?<\/tr>', rows, content, flags=re.DOTALL)

# Add Modals to the end
content = re.sub(r'    <\/div>\n  \);\n\}', r'      {modal?.type === "notes" && <NotesModal appointment={modal.appointment} onClose={() => setModal(null)} />}\n    </div>\n  );\n}', content)


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
