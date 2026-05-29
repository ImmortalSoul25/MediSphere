
import { useState, useCallback } from "react";
import { CalendarCheck, X, AlertCircle, CalendarDays, Plus, Ban, Loader2 } from "lucide-react";
import { useAppointments } from "../../context/AppointmentsContext";
import { useData } from "../../context/DataContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str || str === "") return "—";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

// ─── 12-Hour Time Picker ──────────────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const { hour, minute, period } = value;

  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  const setHour = (raw) => {
    const n = parseInt(raw, 10);
    if (raw === "" || isNaN(n)) { onChange({ ...value, hour: raw }); return; }
    onChange({ ...value, hour: String(clamp(n, 1, 12)) });
  };

  const setMinute = (raw) => {
    const n = parseInt(raw, 10);
    if (raw === "" || isNaN(n)) { onChange({ ...value, minute: raw }); return; }
    onChange({ ...value, minute: String(clamp(n, 0, 59)).padStart(2, "0") });
  };

  const stepHour = (d) => {
    const cur  = parseInt(hour, 10) || 12;
    let   next = cur + d;
    if (next > 12) next = 1;
    if (next < 1)  next = 12;
    onChange({ ...value, hour: String(next) });
  };

  const stepMinute = (d) => {
    const cur  = parseInt(minute, 10) || 0;
    let   next = cur + d;
    if (next > 59) next = 0;
    if (next < 0)  next = 55;
    onChange({ ...value, minute: String(next).padStart(2, "0") });
  };

  const spin = `flex items-center justify-center w-8 h-6 rounded text-slate-500
    hover:bg-slate-100 hover:text-slate-800 transition text-xs font-bold select-none cursor-pointer`;
  const inp  = `w-10 text-center text-base font-semibold text-slate-800 border-0 bg-transparent
    focus:outline-none focus:bg-indigo-50 rounded`;

  return (
    <div className="flex items-center gap-1 border border-slate-200 rounded-xl px-3 py-2 bg-white w-fit">
      <div className="flex flex-col items-center">
        <button type="button" onClick={() => stepHour(1)}  className={spin}>▲</button>
        <input  type="text" inputMode="numeric" maxLength={2} value={hour}
          onChange={(e) => setHour(e.target.value.replace(/\D/g, ""))}
          onBlur={() => { const n = parseInt(hour, 10); onChange({ ...value, hour: String(isNaN(n) || n < 1 || n > 12 ? 12 : n) }); }}
          className={inp} placeholder="12" />
        <button type="button" onClick={() => stepHour(-1)} className={spin}>▼</button>
      </div>

      <span className="text-slate-400 font-bold text-lg">:</span>

      <div className="flex flex-col items-center">
        <button type="button" onClick={() => stepMinute(5)}  className={spin}>▲</button>
        <input  type="text" inputMode="numeric" maxLength={2} value={minute}
          onChange={(e) => setMinute(e.target.value.replace(/\D/g, ""))}
          onBlur={() => { const n = parseInt(minute, 10); onChange({ ...value, minute: String(isNaN(n) || n < 0 || n > 59 ? 0 : n).padStart(2,"0") }); }}
          className={inp} placeholder="00" />
        <button type="button" onClick={() => stepMinute(-5)} className={spin}>▼</button>
      </div>

      <button type="button" onClick={() => onChange({ ...value, period: period === "AM" ? "PM" : "AM" })}
        className="ml-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-indigo-600
                   text-white hover:bg-indigo-700 transition select-none">
        {period}
      </button>
    </div>
  );
}

const EMPTY_TIME = { hour: "12", minute: "00", period: "AM" };

function timeToString(t) {
  const h = t.hour   || "12";
  const m = t.minute || "00";
  return `${h}:${m} ${t.period}`;
}

function parseTimeString(str) {
  if (!str) return EMPTY_TIME;
  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) return { hour: match[1], minute: match[2], period: match[3].toUpperCase() };
  return EMPTY_TIME;
}

// ─── Cancel Confirm ───────────────────────────────────────────────────────────
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
            Cancel the appointment for{" "}
            <span className="font-semibold text-slate-700">{appointment.patientName}</span> on{" "}
            <span className="font-semibold text-slate-700">{fmtDate(appointment.appointmentDate)}</span>?
            This will remove it from the schedule permanently.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose} disabled={busy}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600
                       border border-slate-200 rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
            Keep It
          </button>
          <button onClick={onConfirm} disabled={busy}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm
                       font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl
                       shadow-sm transition disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : null}
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Reschedule Modal ─────────────────────────────────────────────────────────
function RescheduleModal({ appointment, onConfirm, onClose, busy }) {
  const [date,   setDate]   = useState(appointment.appointmentDate || "");
  const [time,   setTime]   = useState(() => parseTimeString(appointment.appointmentTime));
  const [errors, setErrors] = useState({});

  const handleConfirm = () => {
    const e = {};
    if (!date)         e.date = "Date is required.";
    if (!time.hour || !time.minute) e.time = "Time is required.";
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    onConfirm(date, timeToString(time));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Reschedule Appointment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              <span className="font-semibold text-slate-600">{appointment.patientName}</span>
              {" · "}Currently {fmtDate(appointment.appointmentDate)} at {appointment.appointmentTime}
            </p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              New Date <span className="text-rose-500">*</span>
            </label>
            <input type="date" value={date}
              onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                ${errors.date ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
            />
            {errors.date && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.date}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              New Time <span className="text-rose-500">*</span>
            </label>
            <TimePicker value={time} onChange={(t) => { setTime(t); setErrors((p) => ({ ...p, time: "" })); }} />
            {errors.time && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.time}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleConfirm} disabled={busy}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                       bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
            Confirm Reschedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Appointment Modal ────────────────────────────────────────────────────
function AddAppointmentModal({ patients, onConfirm, onClose, busy }) {
  const [useExisting, setUseExisting] = useState(true);
  const [form,   setForm]   = useState({ patientId: "", patientName: "", contact: "", age: "", appointmentDate: "" });
  const [time,   setTime]   = useState(EMPTY_TIME);
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const handlePatientSelect = (e) => {
    const id = e.target.value;
    set("patientId", id);
    if (id) {
      const p = patients.find((p) => p.id === id);
      if (p) { setForm((f) => ({ ...f, patientId: id, patientName: p.name, contact: p.contact, age: p.age || "" })); }
    } else {
      setForm((f) => ({ ...f, patientId: "", patientName: "", contact: "", age: "" }));
    }
    setErrors((p) => ({ ...p, patientId: "" }));
  };

  const switchMode = (toExisting) => {
    setUseExisting(toExisting);
    setForm({ patientId: "", patientName: "", contact: "", age: "", appointmentDate: form.appointmentDate });
    setErrors({});
  };

  const handleSubmit = () => {
    const e = {};
    if (useExisting  && !form.patientId)         e.patientId   = "Please select a patient.";
    if (!useExisting && !form.patientName.trim()) e.patientName = "Name is required.";
    if (!useExisting && !form.contact.trim())     e.contact     = "Contact is required.";
    else if (!useExisting && !/^\d{10}$/.test(form.contact.trim())) e.contact = "Must be 10 digits.";
    if (!form.appointmentDate)                    e.date        = "Date is required.";
    if (!time.hour || !time.minute)               e.time        = "Time is required.";
    if (Object.keys(e).length > 0) { setErrors(e); return; }

    onConfirm({
      id:              `APT-${Date.now()}`,
      patientId:       form.patientId   || "",
      patientName:     form.patientName.trim(),
      contact:         form.contact.trim(),
      age:             form.age.trim(),
      appointmentDate: form.appointmentDate,
      appointmentTime: timeToString(time),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Add Appointment</h2>
            <p className="text-xs text-slate-400 mt-0.5">Directly schedule an appointment</p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {/* Mode toggle */}
          <div className="flex rounded-xl border border-slate-200 overflow-hidden text-xs font-semibold">
            {[["existing", "Select Existing Patient"], ["manual", "Enter Manually"]].map(([val, lbl]) => (
              <button key={val} type="button"
                onClick={() => switchMode(val === "existing")}
                className={`flex-1 py-2.5 transition
                  ${(val === "existing") === useExisting
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-slate-500 hover:bg-slate-50"}`}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Patient */}
          {useExisting ? (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Select Patient <span className="text-rose-500">*</span>
              </label>
              <select value={form.patientId} onChange={handlePatientSelect}
                className={`w-full px-3 py-2.5 text-sm border rounded-xl bg-white text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
                  ${errors.patientId ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}>
                <option value="">Select a patient…</option>
                {[...patients].filter((p) => p.active).sort((a,b) => a.name.localeCompare(b.name))
                  .map((p) => <option key={p.id} value={p.id}>{p.name} — {p.id}</option>)}
              </select>
              {errors.patientId && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.patientId}</p>}
              {form.patientId && (
                <div className="mt-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Contact</span>
                    <span className="text-slate-700 font-medium">{form.contact || "—"}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">Age</span>
                    <span className="text-slate-700 font-medium">{form.age || "—"}</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Patient Name <span className="text-rose-500">*</span>
                </label>
                <input type="text" value={form.patientName}
                  onChange={(e) => set("patientName", e.target.value)}
                  placeholder="Full name"
                  className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                    focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                    ${errors.patientName ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
                />
                {errors.patientName && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.patientName}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Contact <span className="text-rose-500">*</span>
                  </label>
                  <input type="tel" value={form.contact}
                    onChange={(e) => set("contact", e.target.value.replace(/\D/g,"").slice(0,10))}
                    placeholder="10-digit number"
                    className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                      focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                      ${errors.contact ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
                  />
                  {errors.contact && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.contact}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Age</label>
                  <input type="text" value={form.age}
                    onChange={(e) => set("age", e.target.value.replace(/\D/g,"").slice(0,3))}
                    placeholder="Years"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white
                               text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400
                               focus:border-transparent transition"
                  />
                </div>
              </div>
            </>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Appointment Date <span className="text-rose-500">*</span>
            </label>
            <input type="date" value={form.appointmentDate}
              onChange={(e) => { set("appointmentDate", e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                ${errors.date ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
            />
            {errors.date && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.date}</p>}
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">
              Appointment Time <span className="text-rose-500">*</span>
            </label>
            <TimePicker value={time} onChange={(t) => { setTime(t); setErrors((p) => ({ ...p, time: "" })); }} />
            {errors.time && <p className="mt-1 text-xs text-rose-500 flex items-center gap-1"><AlertCircle size={11}/>{errors.time}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={busy}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={busy}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                       bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
            Add Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ScheduledAppointments() {
  const { scheduled, rescheduleAppointment, cancelAppointment, addDirectAppointment, loading, error } = useAppointments();
  const { patients } = useData();

  const [modal, setModal] = useState(null); // null | { type, appointment? }
  const [busy,  setBusy]  = useState(false);
  const [opError, setOpError] = useState(null);

  const run = useCallback(async (fn) => {
    setBusy(true);
    setOpError(null);
    const err = await fn();
    setBusy(false);
    if (err) { setOpError(err); }   // show error but list still refreshes
    else     { setModal(null); }     // only close modal on success
  }, []);

  const handleReschedule = (date, time) =>
    run(() => rescheduleAppointment(modal.appointment.id, date, time));

  const handleCancel = () =>
    run(() => cancelAppointment(modal.appointment.id));

  const handleAdd = (appt) =>
    run(() => addDirectAppointment(appt));

  const sorted = [...(scheduled || [])].sort((a, b) => {
    if (!a.appointmentDate) return  1;
    if (!b.appointmentDate) return -1;
    return new Date(a.appointmentDate) - new Date(b.appointmentDate);
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Scheduled Appointments</h1>
          <p className="mt-1 text-slate-500">All upcoming confirmed appointments.</p>
        </div>
        <button onClick={() => { setOpError(null); setModal({ type: "add" }); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold px-4 py-2.5 rounded-xl
                     shadow-sm transition-colors whitespace-nowrap">
          <Plus size={15} />
          Add Appointment
        </button>
      </div>

      {/* Server error banner */}
      {(error || opError) && (
        <div className="mb-4 flex items-start gap-2 bg-rose-50 border border-rose-200
                        rounded-xl px-4 py-3 text-sm text-rose-700">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold">Something went wrong</p>
            <p className="text-xs mt-0.5 font-mono">{opError || error}</p>
            <p className="text-xs mt-1 text-rose-600">Make sure <code>node server.js</code> is running and has been restarted after the last update.</p>
          </div>
        </div>
      )}

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
                <th className="px-5 py-3 font-semibold">Time</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                  <Loader2 size={20} className="animate-spin mx-auto mb-2 text-slate-300" />
                  Loading appointments…
                </td></tr>
              ) : sorted.length > 0 ? (
                sorted.map((appt) => {
                  const today    = new Date();
                  const apptDate = appt.appointmentDate ? new Date(appt.appointmentDate) : null;
                  const isToday  = apptDate &&
                    apptDate.getFullYear() === today.getFullYear() &&
                    apptDate.getMonth()    === today.getMonth()    &&
                    apptDate.getDate()     === today.getDate();

                  return (
                    <tr key={appt.id}
                      className={`transition-colors duration-100
                        ${isToday ? "bg-indigo-50/40 hover:bg-indigo-50" : "hover:bg-slate-50"}`}>
                      <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{appt.patientId || "—"}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {appt.patientName}
                        {isToday && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full
                                           text-xs font-semibold bg-indigo-100 text-indigo-700">Today</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">{appt.contact}</td>
                      <td className="px-5 py-3.5 text-slate-600">{appt.age || "—"}</td>
                      <td className="px-5 py-3.5 text-slate-600">{fmtDate(appt.appointmentDate)}</td>
                      <td className="px-5 py-3.5 text-slate-600">{appt.appointmentTime || "—"}</td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setOpError(null); setModal({ type: "reschedule", appointment: appt }); }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600
                                       hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg transition-colors">
                            <CalendarDays size={13} /> Reschedule
                          </button>
                          <button onClick={() => { setOpError(null); setModal({ type: "cancel", appointment: appt }); }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-rose-600
                                       hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors">
                            <Ban size={13} /> Cancel
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-full">
                        <CalendarCheck size={28} className="text-slate-400" />
                      </div>
                      <p className="text-slate-400 text-sm">No scheduled appointments yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          {sorted.length} upcoming {sorted.length === 1 ? "appointment" : "appointments"}
        </div>
      </div>

      {modal?.type === "add" && (
        <AddAppointmentModal patients={patients || []} onConfirm={handleAdd}
          onClose={() => setModal(null)} busy={busy} />
      )}
      {modal?.type === "reschedule" && (
        <RescheduleModal appointment={modal.appointment} onConfirm={handleReschedule}
          onClose={() => setModal(null)} busy={busy} />
      )}
      {modal?.type === "cancel" && (
        <CancelConfirm appointment={modal.appointment} onConfirm={handleCancel}
          onClose={() => setModal(null)} busy={busy} />
      )}
    </div>
  );
}