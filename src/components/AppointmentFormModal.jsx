import { useMemo, useState } from "react";
import { AlertCircle, CalendarDays, Loader2, Plus, Search, X } from "lucide-react";

const EMPTY_TIME = { hour: "12", minute: "00", period: "AM" };

function calcAge(dob) {
  if (!dob) return "";
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? String(age) : "";
}

function parseTimeString(str) {
  const match = String(str || "").match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match) return { hour: match[1], minute: match[2], period: match[3].toUpperCase() };
  return EMPTY_TIME;
}

function timeToString(time) {
  return `${time.hour || "12"}:${time.minute || "00"} ${time.period || "AM"}`;
}

function patientToForm(patient) {
  if (!patient) return {};
  return {
    patientId: patient.id || "",
    patientName: patient.name || "",
    contact: patient.contact || "",
    age: calcAge(patient.date_of_birth),
  };
}

function TimePicker({ value, onChange }) {
  const set = (key, raw) => onChange({ ...value, [key]: raw });
  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={value.hour}
        onChange={(e) => set("hour", e.target.value.replace(/\D/g, "").slice(0, 2))}
        className="w-14 px-2 py-2 text-sm border border-slate-200 rounded-xl text-center"
      />
      <span className="text-slate-400 font-bold">:</span>
      <input
        type="text"
        inputMode="numeric"
        maxLength={2}
        value={value.minute}
        onChange={(e) => set("minute", e.target.value.replace(/\D/g, "").slice(0, 2))}
        className="w-14 px-2 py-2 text-sm border border-slate-200 rounded-xl text-center"
      />
      <div className="flex rounded-xl border border-slate-200 overflow-hidden">
        {["AM", "PM"].map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => set("period", p)}
            className={`px-3 py-2 text-xs font-semibold ${
              value.period === p ? "bg-indigo-600 text-white" : "bg-white text-slate-500"
            }`}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">
        {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
          <AlertCircle size={11} />{error}
        </p>
      )}
    </div>
  );
}

export default function AppointmentFormModal({
  title = "Add Appointment",
  patients = [],
  fixedPatient = null,
  initialDate = "",
  initialTime = "",
  onConfirm,
  onClose,
  busy,
}) {
  const lockedPatient = fixedPatient ? patientToForm(fixedPatient) : null;
  const [form, setForm] = useState({
    patientId: lockedPatient?.patientId || "",
    patientName: lockedPatient?.patientName || "",
    contact: lockedPatient?.contact || "",
    age: lockedPatient?.age || "",
    appointmentDate: initialDate,
    appointmentType: "",
    appointmentNotes: "",
  });
  const [time, setTime] = useState(() => parseTimeString(initialTime));
  const [searchText, setSearchText] = useState(lockedPatient ? `${lockedPatient.patientId} - ${lockedPatient.patientName}` : "");
  const [showMatches, setShowMatches] = useState(false);
  const [errors, setErrors] = useState({});

  const matches = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return [];
    return [...patients]
      .filter((patient) =>
        String(patient.id || "").toLowerCase().includes(q) ||
        String(patient.name || "").toLowerCase().includes(q)
      )
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")))
      .slice(0, 8);
  }, [patients, searchText]);

  const inputClass = (hasError) =>
    `w-full px-3 py-2.5 text-sm border rounded-xl transition focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent ${
      hasError ? "border-rose-300 bg-rose-50 text-slate-700" : "border-slate-200 bg-white text-slate-700"
    }`;

  const selectPatient = (patient) => {
    const next = patientToForm(patient);
    setForm((prev) => ({ ...prev, ...next }));
    setSearchText(`${next.patientId} - ${next.patientName}`);
    setShowMatches(false);
    setErrors((prev) => ({ ...prev, patientName: "", contact: "", age: "" }));
  };

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const submit = () => {
    const nextErrors = {};
    if (!form.patientName.trim()) nextErrors.patientName = "Patient name is required.";
    if (form.contact.trim() && !/^\d{10}$/.test(form.contact.trim())) nextErrors.contact = "Enter a valid 10-digit contact number.";
    if (form.age && (Number(form.age) <= 0 || isNaN(Number(form.age)))) nextErrors.age = "Enter a valid age.";
    if (!form.appointmentDate) nextErrors.appointmentDate = "Date is required.";
    if (!form.appointmentType) nextErrors.appointmentType = "Type is required.";
    if (!time.hour || !time.minute || !/^(1[0-2]|[1-9])$/.test(time.hour) || !/^([0-5][0-9])$/.test(time.minute)) {
      nextErrors.time = "Enter a valid 12-hour time.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    onConfirm({
      id: `APT-${Date.now()}`,
      patientId: form.patientId.trim(),
      patientName: form.patientName.trim(),
      contact: form.contact.trim(),
      age: String(form.age).trim(),
      appointmentDate: form.appointmentDate,
      appointmentTime: timeToString(time),
      appointmentType: form.appointmentType,
      appointmentNotes: form.appointmentNotes,
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">{title}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter appointment details</p>
          </div>
          <button onClick={onClose} disabled={busy} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {!lockedPatient && (
            <div className="relative">
              <label className="block text-xs font-semibold text-slate-600 mb-1">Search Existing Patient</label>
              <Search size={14} className="absolute left-3 top-[34px] text-slate-400" />
              <input
                value={searchText}
                onFocus={() => setShowMatches(true)}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setShowMatches(true);
                }}
                placeholder="Type patient ID or name"
                className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              />
              {showMatches && matches.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
                  {matches.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => selectPatient(patient)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 text-slate-700"
                    >
                      <span className="font-mono text-xs text-slate-500">{patient.id}</span>
                      <span className="mx-2 text-slate-300">-</span>
                      <span className="font-semibold">{patient.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Patient ID">
              <input
                value={form.patientId}
                onChange={(e) => set("patientId", e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={!!lockedPatient}
                className={lockedPatient ? "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500" : inputClass(false)}
              />
            </Field>
            <Field label="Patient Name" required error={errors.patientName}>
              <input
                value={form.patientName}
                onChange={(e) => set("patientName", e.target.value)}
                disabled={!!lockedPatient}
                className={lockedPatient ? "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500" : inputClass(!!errors.patientName)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Contact Number" error={errors.contact}>
              <input
                value={form.contact}
                onChange={(e) => set("contact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                disabled={!!lockedPatient}
                className={lockedPatient ? "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500" : inputClass(!!errors.contact)}
              />
            </Field>
            <Field label="Age" error={errors.age}>
              <input
                value={form.age}
                onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))}
                disabled={!!lockedPatient}
                className={lockedPatient ? "w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500" : inputClass(!!errors.age)}
              />
            </Field>
          </div>

          <Field label="Date" required error={errors.appointmentDate}>
            <input
              type="date"
              value={form.appointmentDate}
              onChange={(e) => set("appointmentDate", e.target.value)}
              className={inputClass(!!errors.appointmentDate)}
            />
          </Field>

          <Field label="Time" required error={errors.time}>
            <TimePicker value={time} onChange={setTime} />
          </Field>

          <Field label="Appointment Type" required error={errors.appointmentType}>
            <select
              value={form.appointmentType}
              onChange={(e) => set("appointmentType", e.target.value)}
              className={inputClass(!!errors.appointmentType)}
            >
              <option value="" disabled>Select Type</option>
              <option value="First Consultation">First Consultation</option>
              <option value="Follow Up">Follow Up</option>
              <option value="ANC">ANC</option>
              <option value="bloodtest">bloodtest</option>
              <option value="Vaccine">Vaccine</option>
              <option value="2nd Opinion">2nd Opinion</option>
              <option value="Sonography">Sonography</option>
              <option value="Surgery">Surgery</option>
              <option value="Meeting">Meeting</option>
              <option value="Other">Other</option>
            </select>
          </Field>

          <Field label="Appointment Notes">
            <textarea
              value={form.appointmentNotes}
              onChange={(e) => set("appointmentNotes", e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className={inputClass(false)}
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-50">
            Cancel
          </button>
          <button onClick={submit} disabled={busy} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50">
            {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

export { calcAge, parseTimeString, TimePicker, timeToString };
