import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Ban, CalendarCheck, CalendarDays, Loader2, Plus, StickyNote, X, Eye, Clock, Hash } from "lucide-react";
import AppointmentFormModal, { parseTimeString, TimePicker, timeToString } from "../../components/AppointmentFormModal";
import { useAppointments } from "../../context/AppointmentsContext";
import { useData } from "../../context/DataContext";
import { ViewDetailsModal, PatientForm, EMPTY_FORM } from "../Patients";

function fmtDate(str) {
  if (!str || str === "") return "-";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

const APPT_TYPE_STYLES = {
  "First Consultation": "bg-violet-50 text-violet-700",
  "Follow Up": "bg-teal-50 text-teal-700",
  "ANC": "bg-fuchsia-50 text-fuchsia-700",
  "bloodtest": "bg-red-50 text-red-700",
  "Vaccine": "bg-cyan-50 text-cyan-700",
  "2nd Opinion": "bg-lime-50 text-lime-700",
  "Surgery": "bg-rose-50 text-rose-700",
  "Routine Check": "bg-sky-50 text-sky-700",
  "Other": "bg-amber-50 text-amber-700",
};

function ApptTypeBadge({ type }) {
  if (!type) return <span className="text-slate-300 text-xs">—</span>;
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

function CancelConfirm({ appointment, onConfirm, onClose, busy }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 text-center">
          <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
            <Ban size={24} className="text-rose-500" />
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Cancel Appointment?</h2>
          <p className="text-sm text-slate-500">
            Cancel the appointment for <span className="font-semibold text-slate-700">{appointment.patientName}</span> on{" "}
            <span className="font-semibold text-slate-700">{fmtDate(appointment.appointmentDate)}</span>?
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} disabled={busy} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
            Keep It
          </button>
          <button onClick={onConfirm} disabled={busy} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-sm transition disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : null} Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function AppointmentModal({ title, initialDate = "", initialTime = "", onConfirm, onClose, busy }) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(() => parseTimeString(initialTime));
  const [errors, setErrors] = useState({});

  const submit = () => {
    const e = {};
    if (!date) e.date = "Date is required.";
    if (!time.hour || !time.minute || !/^(1[0-2]|[1-9])$/.test(time.hour) || !/^([0-5][0-9])$/.test(time.minute)) {
      e.time = "Enter a valid 12-hour time.";
    }
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    onConfirm(date, timeToString(time));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} disabled={busy} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Appointment Date <span className="text-rose-500">*</span></label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`w-full px-3 py-2.5 text-sm border rounded-xl ${errors.date ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`} />
            {errors.date && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11} />{errors.date}</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Appointment Time <span className="text-rose-500">*</span></label>
            <TimePicker value={time} onChange={setTime} />
            {errors.time && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11} />{errors.time}</p>}
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">Cancel</button>
          <button onClick={submit} disabled={busy} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ScheduledAppointments() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const { scheduled, rescheduleAppointment, cancelAppointment, addDirectAppointment, loading, error } = useAppointments();
  const { patients, fetchPatientDetails, addPatient } = useData();
  const [modal, setModal] = useState(null);
  const [busy, setBusy] = useState(false);
  const [opError, setOpError] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(null);

  const run = useCallback(async (fn) => {
    setBusy(true);
    setOpError(null);
    const err = await fn();
    setBusy(false);
    if (err) setOpError(err);
    else setModal(null);
  }, []);

  const handleViewPatient = (appt) => {
    if (patients.find(p => p.id === appt.patientId)) {
      navigate(`/patients/${appt.patientId}`);
    } else {
      setModal({ type: "unknown_patient", request: { ...EMPTY_FORM, name: appt.patientName, contact: appt.contactNumber || appt.contact } });
    }
  };

  const handleAddNewPatient = (data) => {
    setShowAddPatient(data);
    setModal(null);
  };

  const handleSaveNewPatient = async (data) => {
    await addPatient(data);
    setShowAddPatient(null);
  };

  const sortedAll = [...(scheduled || [])].sort((a, b) => new Date(a.appointmentDate || 0) - new Date(b.appointmentDate || 0));
  
  const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const todayStr = localISO(new Date());
  
  const tomorrowStr = localISO(new Date(Date.now() + 86400000));
  
  const scheduledToday = sortedAll.filter(a => a.appointmentDate === todayStr).length;
  const scheduledTomorrow = sortedAll.filter(a => a.appointmentDate === tomorrowStr).length;
  
  const sorted = sortedAll.filter(a => {
    if (filter === "Today") return a.appointmentDate === todayStr;
    if (filter === "Tomorrow") return a.appointmentDate === tomorrowStr;
    return true;
  });


  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Scheduled Appointments</h1>
          <p className="mt-1 text-slate-500">All upcoming confirmed appointments.</p>
        </div>
        <button onClick={() => { setOpError(null); setModal({ type: "add" }); }} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors whitespace-nowrap">
          <Plus size={15} /> Add Appointment
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Scheduled Today</p>
            <p className="text-2xl font-bold text-slate-800">{scheduledToday}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><Clock size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Scheduled Tomorrow</p>
            <p className="text-2xl font-bold text-slate-800">{scheduledTomorrow}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><CalendarDays size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Scheduled</p>
            <p className="text-2xl font-bold text-slate-800">{sortedAll.length}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg"><Hash size={20} /></div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 mb-4">
        {["All", "Today", "Tomorrow"].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${filter === f ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            {f}
          </button>
        ))}
      </div>

      {(error || opError) && (
        <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div><p className="font-semibold">Something went wrong</p><p className="text-xs mt-0.5 font-mono">{opError || error}</p></div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 font-semibold w-20">ID</th>
                <th className="px-3 py-3 font-semibold w-32">Name</th>
                <th className="px-3 py-3 font-semibold w-24 hidden lg:table-cell">Contact</th>
                <th className="px-3 py-3 font-semibold w-12">Age</th>
                <th className="px-3 py-3 font-semibold w-24">Date</th>
                <th className="px-3 py-3 font-semibold w-16">Day</th>
                <th className="px-3 py-3 font-semibold w-20">Time</th>
                <th className="px-3 py-3 font-semibold w-28">Appt Type</th>
                <th className="px-3 py-3 font-semibold w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-slate-400"><Loader2 size={20} className="animate-spin mx-auto mb-2 text-slate-300" />Loading appointments...</td></tr>
              ) : sorted.length > 0 ? (
                sorted.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-3 py-2.5 font-mono text-slate-500 truncate">{appt.patientId || "-"}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800 truncate" title={appt.patientName}>{appt.patientName}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate hidden lg:table-cell">{appt.contactNumber || appt.contact}</td>
                    <td className="px-3 py-2.5 text-slate-600">{appt.age || "-"}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate">{fmtDate(appt.appointmentDate)}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate">{appt.appointment_day || "-"}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate">{appt.appointmentTime || "-"}</td>
                    <td className="px-3 py-2.5 truncate"><ApptTypeBadge type={appt.appointmentType} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button title="View Patient Details" onClick={() => handleViewPatient(appt)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                          <Eye size={15} />
                        </button>
                        <button title="Reschedule" onClick={() => { setOpError(null); setModal({ type: "reschedule", appointment: appt }); }} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 transition">
                          <CalendarDays size={15} />
                        </button>
                        <button title="View Notes" onClick={() => { setOpError(null); setModal({ type: "notes", appt: appt }); }} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition">
                          <StickyNote size={15} />
                        </button>
                        <button title="Cancel" onClick={() => { setOpError(null); setModal({ type: "cancel", appointment: appt }); }} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition">
                          <Ban size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={9} className="px-5 py-16 text-center"><div className="flex flex-col items-center gap-3"><div className="bg-slate-100 p-4 rounded-full"><CalendarCheck size={28} className="text-slate-400" /></div><p className="text-slate-400 text-sm">No scheduled appointments found.</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">{sorted.length} upcoming {sorted.length === 1 ? "appointment" : "appointments"}</div>
      </div>

      {modal?.type === "add" && (
        <AppointmentFormModal
          patients={patients || []}
          onConfirm={(appt) => run(() => addDirectAppointment(appt))}
          onClose={() => setModal(null)}
          busy={busy}
        />
      )}
      {modal?.type === "reschedule" && <AppointmentModal title="Reschedule Appointment" initialDate={modal.appointment.appointmentDate} initialTime={modal.appointment.appointmentTime} onConfirm={(date, time) => run(() => rescheduleAppointment(modal.appointment.id, date, time))} onClose={() => setModal(null)} busy={busy} />}
      {modal?.type === "notes" && <NotesModal appointment={modal.appt} onClose={() => setModal(null)} />}
      {modal?.type === "cancel" && <CancelConfirm appointment={modal.appointment} onConfirm={() => run(() => cancelAppointment(modal.appointment.id))} onClose={() => setModal(null)} busy={busy} />}
      
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
