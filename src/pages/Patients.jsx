// src/pages/Patients.jsx

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search, UserPlus, Eye, Pencil, Trash2, X, AlertCircle,
  ArrowUpDown, Filter, ChevronDown, ArrowUp, ArrowDown, Loader2, Plus, RefreshCw, User, Activity,
} from "lucide-react";
import AppointmentFormModal from "../components/AppointmentFormModal";
import PhotoCapture from "../components/PhotoCapture";
import { useData } from "../context/DataContext";
import { useAppointments } from "../context/AppointmentsContext";




function genderLabel(gender) {
  if (!gender) return { label: "-", color: "bg-slate-100 text-slate-600" };
  const lower = gender.toLowerCase();
  if (lower === "male" || lower === "m") return { label: "M", color: "bg-blue-100 text-blue-700" };
  if (lower === "female" || lower === "f") return { label: "F", color: "bg-pink-100 text-pink-700" };
  if (lower === "other" || lower === "o") return { label: "O", color: "bg-emerald-100 text-emerald-700" };
  return { label: gender.charAt(0).toUpperCase(), color: "bg-slate-100 text-slate-700" };
}

export function generatePatientId(patients) {
  const nums = patients
    .map((p) => parseInt(p.id, 10))
    .filter((n) => !isNaN(n) && n >= 100000 && n <= 999999);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 100001;
  return String(Math.min(next, 999999));
}

function fmtDate(str) {
  if (!str || str === "") return "—";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

export function calcAge(dob) {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age >= 0 ? age : null;
}

function ActiveBadge({ active }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {active ? "Yes" : "No"}
    </span>
  );
}

function AbhaBadge({ status }) {
  const map = {
    "Not Linked": "bg-slate-100 text-slate-600 border-slate-200",
    "Consent Pending": "bg-amber-100 text-amber-700 border-amber-200",
    "Linked": "bg-green-100 text-green-700 border-green-200",
    "Synced": "bg-blue-100 text-blue-700 border-blue-200",
    "Sync Failed": "bg-orange-100 text-orange-700 border-orange-200",
  };
  const colors = map[status] || map["Not Linked"];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${colors}`}>
      {status || "Not Linked"}
    </span>
  );
}

const conditionColors = [
  "bg-red-50 text-red-700 border-red-100",
  "bg-orange-50 text-orange-700 border-orange-100",
  "bg-amber-50 text-amber-700 border-amber-100",
  "bg-emerald-50 text-emerald-700 border-emerald-100",
  "bg-teal-50 text-teal-700 border-teal-100",
  "bg-cyan-50 text-cyan-700 border-cyan-100",
  "bg-sky-50 text-sky-700 border-sky-100",
  "bg-blue-50 text-blue-700 border-blue-100",
  "bg-indigo-50 text-indigo-700 border-indigo-100",
  "bg-violet-50 text-violet-700 border-violet-100",
  "bg-purple-50 text-purple-700 border-purple-100",
  "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
  "bg-pink-50 text-pink-700 border-pink-100",
  "bg-rose-50 text-rose-700 border-rose-100"
];

function getConditionColorClass(cond) {
  if (!cond) return conditionColors[0];
  let sum = 0;
  for (let i = 0; i < cond.length; i++) {
    sum += cond.charCodeAt(i);
  }
  return conditionColors[sum % conditionColors.length];
}

function ConditionBadge({ conditions }) {
  if (!Array.isArray(conditions) || conditions.length === 0) return <span className="text-slate-300 text-xs">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {conditions.slice(0, 3).map((c, i) => (
        <span key={i} className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getConditionColorClass(c)}`}>
          {c}
        </span>
      ))}
      {conditions.length > 3 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600">
          +{conditions.length - 3}
        </span>
      )}
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

function MultiSelectDropdown({ label, options, selected, onChange, disabled }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2 text-sm border rounded-xl text-left flex justify-between items-center transition bg-white
                   ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : "border-slate-200 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"}
                   ${open ? "ring-2 ring-indigo-400 border-transparent" : ""}`}
      >
        <span className="truncate pr-4">
          {selected.length === 0 ? `Select ${label}...` : `${selected.length} selected`}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1">
            {options.length === 0 ? (
              <div className="px-4 py-2 text-sm text-slate-400 text-center">No options available</div>
            ) : (
              options.map(opt => {
                const isSelected = selected.includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelected = e.target.checked
                          ? [...selected, opt.value]
                          : selected.filter(x => x !== opt.value);
                        onChange(newSelected);
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="flex-1">{opt.label}</span>
                  </label>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}

export const EMPTY_FORM = {
  id: "",
  name: "",
  date_of_birth: "",
  contact: "",
  gender: "",
  is_active: "true",
  receive_msgs: "true",
  conditions: [],
  medical_history: [],
  expected_due_date: "",
  notes: "",
  abhaId: "",
};

export function PatientForm({ title, initial, isEdit, patients, onSave, onClose }) {
  const { configConditions, configMedicalHistory } = useData();

  const generateId = async () => {
    try {
      const res = await fetch("/patient/generate-id");
      const data = await res.json();
      setForm(prev => ({ ...prev, id: data.id }));
    } catch(e) {
      console.error(e);
    }
  };

  const [form, setForm] = useState({ ...initial });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const setGender = (gender) => {
    setForm((p) => ({
      ...p,
      gender,
      // If gender changes, we should ideally clear conditions that no longer match,
      // but for simplicity we'll just clear them all to force re-selection.
      conditions: []
    }));
    setErrors((p) => ({ ...p, gender: "", conditions: "" }));
  };

  const validate = () => {
    const e = {};
    if (!isEdit && form.id.trim() !== "") {
      if (!/^\d{6}$/.test(form.id.trim())) e.id = "Must be exactly 6 digits.";
      else if (patients.some((p) => p.id === form.id.trim())) e.id = "ID already exists.";
    }
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.contact.trim()) e.contact = "Contact number is required.";
    else if (!/^\d{10}$/.test(form.contact.trim())) e.contact = "Must be 10 digits.";
    if (form.gender === "") e.gender = "Please select gender.";
    if (form.is_active === "") e.is_active = "Please select a status.";
    if (form.receive_msgs === "") e.receive_msgs = "Please select message preference.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setSaving(true);
    setServerError(null);

    try {
      const finalId = isEdit
        ? initial.id
        : (form.id.trim() !== "" ? form.id.trim() : generatePatientId(patients));

      await onSave({
        ...form,
        id: finalId,
        is_active: form.is_active === "true" || form.is_active === true,
        receive_msgs: form.receive_msgs === "true" || form.receive_msgs === true,
      });

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        await fetch(`/patient/${finalId}/photo`, {
          method: "POST",
          body: formData,
        });
      }
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-3 py-2 text-sm border rounded-xl transition
     focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
     ${hasError ? "border-rose-300 bg-rose-50 text-slate-700" : "border-slate-200 bg-white text-slate-700"}`;



  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          {serverError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700 font-medium">
              {serverError}
            </div>
          )}

          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <Field label="Patient ID" error={errors.id}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={form.id}
                  onChange={(e) => set("id", e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder={isEdit ? "" : "6-digit number (auto if blank)"}
                  disabled={isEdit}
                  className={isEdit
                    ? "w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-400 cursor-not-allowed"
                    : inputClass(!!errors.id)}
                />
              </Field>
            </div>
            {!isEdit && (
              <button
                type="button"
                onClick={generateId}
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-colors whitespace-nowrap h-[38px] mt-5"
              >
                Generate ID
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required error={errors.name}>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Full name"
                className={inputClass(!!errors.name)}
              />
            </Field>

            <Field label="Contact" required error={errors.contact}>
              <input
                type="tel"
                value={form.contact}
                onChange={(e) => set("contact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number"
                inputMode="numeric"
                className={inputClass(!!errors.contact)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Date of Birth">
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
                className={inputClass(false)}
              />
            </Field>

            <Field label="Gender" required error={errors.gender}>
              <select
                value={form.gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass(!!errors.gender)}
              >
                <option value="">Select...</option>
                <option value="M">Male - M</option>
                <option value="F">Female - F</option>
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Active Status" required error={errors.is_active}>
              <select
                value={form.is_active}
                onChange={(e) => set("is_active", e.target.value)}
                className={inputClass(!!errors.is_active)}
              >
                <option value="">Select...</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>

            <Field label="Receive Msgs" required error={errors.receive_msgs}>
              <select
                value={form.receive_msgs}
                onChange={(e) => set("receive_msgs", e.target.value)}
                className={inputClass(!!errors.receive_msgs)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>

            <Field label="ABHA ID (Optional)" error={errors.abhaId}>
              <input
                value={form.abhaId || ""}
                onChange={(e) => set("abhaId", e.target.value)}
                placeholder="xx-xxxx-xxxx-xxxx"
                className={inputClass(!!errors.abhaId)}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Field label="Conditions" error={errors.conditions}>
              <MultiSelectDropdown
                label="Conditions"
                disabled={!form.gender}
                options={configConditions
                  .filter(c => c.gender === "Both" || c.gender === (form.gender === 'F' ? 'Female' : form.gender === 'M' ? 'Male' : ''))
                  .map(c => ({ label: c.name, value: c.code }))
                }
                selected={form.conditions || []}
                onChange={(selected) => setForm({ ...form, conditions: selected })}
              />
            </Field>
          </div>
          
          <div className="grid grid-cols-1 gap-3 mt-4">
            <Field label="Medical History" error={errors.medical_history}>
              <MultiSelectDropdown
                label="Medical History"
                disabled={false}
                options={configMedicalHistory.map(m => ({ label: m.name, value: m.name }))}
                selected={form.medical_history || []}
                onChange={(selected) => setForm({ ...form, medical_history: selected })}
              />
            </Field>
          </div>

          {(() => {
            const hasPregnancy = (form.conditions || []).some(code => {
              const cond = configConditions.find(c => c.code === code);
              return cond && cond.name.toLowerCase().includes("pregnancy");
            });
            return hasPregnancy;
          })() && (
            <Field label="Expected Due Date">
              <input
                type="date"
                value={form.expected_due_date || ""}
                onChange={(e) => set("expected_due_date", e.target.value)}
                className={inputClass(false)}
              />
            </Field>
          )}

          <PhotoCapture 
            currentPhotoUrl={isEdit ? `/patient/${form.id}/photo` : null}
            onPhotoSelected={(file, url) => setPhotoFile(file)}
          />

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              placeholder="Clinical notes, remarks..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white
                         text-slate-700 resize-y focus:outline-none focus:ring-2
                         focus:ring-indigo-400 focus:border-transparent transition"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white
                       bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50"
          >
            {saving && <Loader2 size={13} className="animate-spin" />}
            {isEdit ? "Save Changes" : "Add Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-800">{value || "—"}</span>
    </div>
  );
}

export function ViewDetailsModal({ patientId, onClose, onEdit, onDelete, fetchPatientDetails }) {
  const { fetchPatientAppointments, addDirectAppointment } = useAppointments();
  const [details, setDetails] = useState(null);
  const [appointments, setAppointments] = useState(null);
  const [loadingDet, setLoadingDet] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [historyBusy, setHistoryBusy] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [fetched, setFetched] = useState(false);

  if (!fetched) {
    setFetched(true);
    fetchPatientDetails(patientId)
      .then((d) => {
        setDetails(d);
        setLoadingDet(false);
      })
      .catch(() => setLoadingDet(false));
  }

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(patientId);
  };

  const openHistory = async () => {
    setShowHistory(true);
    if (!appointments) {
      const data = await fetchPatientAppointments(patientId);
      setAppointments([...(data.scheduled || []), ...(data.past || [])]);
    }
  };

  const reloadHistory = async () => {
    const data = await fetchPatientAppointments(patientId);
    setAppointments([...(data.scheduled || []), ...(data.past || [])]);
  };

  const addHistoryAppointment = async (appointment) => {
    setHistoryBusy(true);
    setHistoryError(null);
    const err = await addDirectAppointment(appointment);
    if (err) {
      setHistoryError(err);
    } else {
      await reloadHistory();
      setShowAddHistory(false);
    }
    setHistoryBusy(false);
  };

  const md = details?.metadata;
  const age = md ? calcAge(md.date_of_birth) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">{md?.name ?? "Loading..."}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {patientId}</p>
          </div>

          <div className="flex items-center gap-2">
            {details && (
              <>
                <button
                  onClick={() => onEdit(details)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                             bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                >
                  <Pencil size={12} /> Edit
                </button>
                <button
                  onClick={openHistory}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                             bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Appt History
                </button>

                {!confirmDelete ? (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                               bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                ) : (
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-rose-700 font-semibold">Confirm?</span>
                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700
                                 px-2 py-1 rounded-lg transition disabled:opacity-50"
                    >
                      {deleting ? "..." : "Yes"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition"
                    >
                      No
                    </button>
                  </div>
                )}
              </>
            )}

            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition ml-1">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          {loadingDet ? (
            <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading details...
            </div>
          ) : details ? (
            <>
              <DetailRow label="Patient ID" value={md.id} />
              <DetailRow label="Name" value={md.name} />
              <DetailRow label="Contact" value={md.contact} />
              <DetailRow label="Date of Birth" value={fmtDate(md.date_of_birth)} />
              <DetailRow label="Age" value={age !== null ? `${age} years` : "—"} />
              <DetailRow label="Gender" value=<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${genderLabel(md.gender).color}`}>{genderLabel(md.gender).label}</span> />
              <DetailRow label="Condition" value={md.condition || "—"} />
              {md.condition === "Pregnancy" && (
                <DetailRow label="Expected Due Date" value={fmtDate(md.expected_due_date)} />
              )}
              <DetailRow label="Status" value={md.is_active ? "Active" : "Inactive"} />
              <DetailRow label="Receive Msgs" value={md.receive_msgs ? "Yes" : "No"} />
              <DetailRow label="Last Visit" value={fmtDate(md.last_visit)} />
              <div className="py-2.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Notes</span>
                <p className="text-sm text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">
                  {details.notes || "—"}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400 py-8 text-center">Could not load patient details.</p>
          )}
        </div>
      </div>

      {showHistory && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-800">Appointment History</h2>
                <p className="text-xs text-slate-400 mt-0.5">{md?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddHistory(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition"
                >
                  <Plus size={12} /> Add
                </button>
                <button onClick={() => setShowHistory(false)} className="text-slate-400 hover:text-slate-600 transition">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 max-h-[55vh] overflow-y-auto">
              {historyError && (
                <div className="mb-3 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700">
                  {historyError}
                </div>
              )}
              {!appointments ? (
                <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
                  <Loader2 size={16} className="animate-spin" /> Loading history...
                </div>
              ) : appointments.length > 0 ? (
                <div className="space-y-2">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="border border-slate-100 rounded-xl px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{fmtDate(appt.appointmentDate)} at {appt.appointmentTime || "-"}</p>
                      <p className="text-xs text-slate-400 mt-1">{appt.appointment_day || ""}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-8 text-center">No appointments found for this patient.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddHistory && md && (
        <AppointmentFormModal
          title="Add Appointment"
          fixedPatient={{
            id: md.id,
            name: md.name,
            contact: md.contact,
            date_of_birth: md.date_of_birth,
          }}
          onConfirm={addHistoryAppointment}
          onClose={() => setShowAddHistory(false)}
          busy={historyBusy}
        />
      )}
    </div>
  );
}

function SortButton({ sortKey, currentKey, sortDir, label, onClick }) {
  const active = currentKey === sortKey;

  return (
    <button
      onClick={() => onClick(sortKey)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
        border transition whitespace-nowrap
        ${active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}`}
    >
      {active
        ? sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        : <ArrowUpDown size={12} className="text-slate-400" />}
      {label}
    </button>
  );
}

export default function Patients() {
  const navigate = useNavigate();
  const { configConditions, configMedicalHistory, patients, loading, error, addPatient, updatePatient, deletePatient, fetchPatientDetails } = useData();

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState("last_visit");
  const [sortDir, setSortDir] = useState("desc");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterActive, setFilterActive] = useState("all");
  const [filterGender, setFilterGender] = useState("all");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [modal, setModal] = useState(null);


  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleCondition = (c) =>
    setSelectedConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const activeFilterCount =
    (filterActive !== "all" ? 1 : 0) +
    (filterGender !== "all" ? 1 : 0) +
    (ageMin !== "" || ageMax !== "" ? 1 : 0) +
    selectedConditions.length;

  const clearFilters = () => {
    setFilterActive("all");
    setFilterGender("all");
    setAgeMin("");
    setAgeMax("");
    setSelectedConditions([]);
  };

  const displayed = useMemo(() => {
    let list = [...(patients || [])];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.includes(q) ||
        p.contact.includes(q) ||
        (p.gender || "").toLowerCase().includes(q)
      );
    }

    if (filterActive === "active") list = list.filter((p) => p.is_active);
    if (filterActive === "inactive") list = list.filter((p) => !p.is_active);

    if (filterGender === "M") list = list.filter((p) => p.gender === "Male");
    if (filterGender === "F") list = list.filter((p) => p.gender === "Female");

    if (selectedConditions.length > 0) {
      list = list.filter((p) => p.conditions && p.conditions.some(c => selectedConditions.includes(c)));
    }

    if (ageMin !== "" || ageMax !== "") {
      list = list.filter((p) => {
        const age = calcAge(p.date_of_birth);
        if (age === null) return false;
        if (ageMin !== "" && age < Number(ageMin)) return false;
        if (ageMax !== "" && age > Number(ageMax)) return false;
        return true;
      });
    }

    list.sort((a, b) => {
      let av;
      let bv;

      if (sortKey === "name") {
        av = a.name.toLowerCase();
        bv = b.name.toLowerCase();
      }

      if (sortKey === "id") {
        av = parseInt(a.id, 10) || 0;
        bv = parseInt(b.id, 10) || 0;
      }

      if (sortKey === "age") {
        av = calcAge(a.date_of_birth) ?? -1;
        bv = calcAge(b.date_of_birth) ?? -1;
      }

      if (sortKey === "last_visit") {
        av = a.last_visit || "0000-00-00";
        bv = b.last_visit || "0000-00-00";
      }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [patients, query, filterActive, filterGender, selectedConditions, ageMin, ageMax, sortKey, sortDir]);

  const handleAdd = async (data) => {
    await addPatient(data);
    setModal(null);
  };

  const handleEdit = async (data) => {
    await updatePatient(data);
    setModal(null);
  };

  const handleDelete = async (id) => {
    await deletePatient(id);
    setModal(null);
  };

  const openEdit = (details) => {
    const md = details.metadata;
    setModal({
      type: "edit",
      initial: {
        ...md, // Copy all existing metadata to preserve fields like abhaProfile, altContact, etc.
        id: md.id,
        name: md.name,
        date_of_birth: md.date_of_birth || "",
        contact: md.contact || "",
        gender: md.gender || "",
        is_active: String(md.is_active),
        receive_msgs: String(md.receive_msgs ?? true),
        last_visit: md.last_visit || "",
        conditions: md.conditions || [],
        medical_history: md.medical_history || [],
        expected_due_date: md.expected_due_date || "",
        notes: details.notes || "",
        visits: details.visits || [],
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-16 justify-center">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading patients...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patients</h1>
          <p className="mt-1 text-slate-500">Manage all registered patients.</p>
        </div>
        <button onClick={() => navigate('/patients/add')}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold px-4 py-2.5 rounded-xl
                     shadow-sm transition-colors whitespace-nowrap">
          <UserPlus size={16} /> Add Patient
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Total Patients</p>
            <p className="text-2xl font-bold text-slate-800">{patients?.length || 0}</p>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg"><User size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Active</p>
            <p className="text-2xl font-bold text-slate-800">{patients?.filter(p => p.is_active === true || p.is_active === "true").length || 0}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><Activity size={20} /></div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Inactive</p>
            <p className="text-2xl font-bold text-slate-800">{patients?.filter(p => p.is_active === false || p.is_active === "false").length || 0}</p>
          </div>
          <div className="p-3 bg-slate-50 text-slate-600 rounded-lg"><AlertCircle size={20} /></div>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">Backend connection error</p>
          <p className="font-mono text-xs mt-0.5">{error}</p>
          <p className="text-xs mt-1">Make sure <code>uvicorn main:app --reload --port 8000</code> is running.</p>
        </div>
      )}

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, ID, contact or gender..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl
                         bg-white shadow-sm text-slate-700 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400
                         focus:border-transparent transition"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <ArrowUpDown size={12} /> Sort:
            </span>
            <SortButton sortKey="last_visit" currentKey={sortKey} sortDir={sortDir} label="Last Visit" onClick={handleSort} />
            <SortButton sortKey="name" currentKey={sortKey} sortDir={sortDir} label="Name" onClick={handleSort} />
            <SortButton sortKey="id" currentKey={sortKey} sortDir={sortDir} label="Patient ID" onClick={handleSort} />
            <SortButton sortKey="age" currentKey={sortKey} sortDir={sortDir} label="Age" onClick={handleSort} />
          </div>

          <div className="relative">
            <button
              onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold
                border rounded-xl transition whitespace-nowrap
                ${activeFilterCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
            >
              <Filter size={14} />
              Filter
              {activeFilterCount > 0 && (
                <span className="bg-white/30 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown size={13} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
            </button>

            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200
                              rounded-xl shadow-lg p-4 w-56 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Filters</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                      Clear all
                    </button>
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Status</p>
                  <div className="flex gap-2">
                    {[["all", "All"], ["active", "Active"], ["inactive", "Inactive"]].map(([val, lbl]) => (
                      <button key={val} onClick={() => setFilterActive(val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition
                          ${filterActive === val
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Gender</p>
                  <div className="flex gap-2">
                    {[["all", "All"], ["M", "Male"], ["F", "Female"]].map(([val, lbl]) => (
                      <button key={val} onClick={() => setFilterGender(val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition
                          ${filterGender === val
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Conditions</p>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {configConditions.map((c) => (
                      <label key={c.code} className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox"
                          checked={selectedConditions.includes(c.code)}
                          onChange={() => toggleCondition(c.code)}
                          className="w-3.5 h-3.5 text-indigo-600 rounded border-slate-300
                                     focus:ring-indigo-500 cursor-pointer" />
                        <span className="text-xs text-slate-600 group-hover:text-slate-800 transition">
                          {c.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Age Range</p>
                  <div className="flex items-center gap-2">
                    <input type="number" min="0" max="120" placeholder="Min"
                      value={ageMin} onChange={(e) => setAgeMin(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-indigo-400
                                 focus:border-transparent transition text-slate-700" />
                    <span className="text-slate-400 text-xs">to</span>
                    <input type="number" min="0" max="120" placeholder="Max"
                      value={ageMax} onChange={(e) => setAgeMax(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-lg
                                 focus:outline-none focus:ring-2 focus:ring-indigo-400
                                 focus:border-transparent transition text-slate-700" />
                  </div>
                </div>
              </div>
            )}
          </div>


        </div>

        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {filterActive !== "all" && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700
                               text-xs font-semibold px-2.5 py-1 rounded-full">
                {filterActive === "active" ? "Active only" : "Inactive only"}
                <button onClick={() => setFilterActive("all")} className="hover:text-green-900"><X size={11} /></button>
              </span>
            )}
            {filterGender !== "all" && (
              <span className="flex items-center gap-1.5 bg-blue-50 text-blue-700
                               text-xs font-semibold px-2.5 py-1 rounded-full">
                {filterGender === "M" ? "Male" : "Female"}
                <button onClick={() => setFilterGender("all")} className="hover:text-blue-900"><X size={11} /></button>
              </span>
            )}
            {selectedConditions.map((c) => (
              <span key={c} className="flex items-center gap-1.5 bg-teal-50 text-teal-700
                                       text-xs font-semibold px-2.5 py-1 rounded-full">
                {c}
                <button onClick={() => toggleCondition(c)} className="hover:text-teal-900"><X size={11} /></button>
              </span>
            ))}
            {(ageMin !== "" || ageMax !== "") && (
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-700
                               text-xs font-semibold px-2.5 py-1 rounded-full">
                Age: {ageMin || "0"}–{ageMax || "∞"}
                <button onClick={() => { setAgeMin(""); setAgeMax(""); }} className="hover:text-amber-900"><X size={11} /></button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 font-semibold">Photo</th>
                <th className="px-3 py-3 font-semibold">Patient ID</th>
                <th className="px-3 py-3 font-semibold">Name</th>
                <th className="px-3 py-3 font-semibold">Contact</th>
                <th className="px-3 py-3 font-semibold">Gender</th>
                <th className="px-3 py-3 font-semibold">Age</th>
                <th className="px-3 py-3 font-semibold">Condition</th>
                <th className="px-3 py-3 font-semibold">Last Visit</th>
                <th className="px-3 py-3 font-semibold">Active</th>
                <th className="px-3 py-3 font-semibold">ABHA Status</th>
                <th className="px-3 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.length > 0 ? (
                displayed.map((p) => {
                  const age = calcAge(p.date_of_birth);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors duration-100">
                      <td className="px-3 py-2">
                        <img 
                          src={`/patient/${p.id}/photo?t=${Date.now()}`} 
                          alt={p.name} 
                          className="w-8 h-8 rounded-full object-cover border border-slate-200"
                          onError={(e) => { e.target.src = "/patient/default/photo"; }}
                        />
                      </td>
                      <td className="px-3 py-3.5 font-mono text-slate-500 text-xs">{p.id}</td>
                      <td className="px-3 py-3.5 font-medium text-slate-800">{p.name}</td>
                      <td className="px-3 py-3.5 text-slate-600">{p.contact}</td>
                      <td className="px-3 py-3.5 text-slate-600"><span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${genderLabel(p.gender).color}`}>{genderLabel(p.gender).label}</span></td>
                      <td className="px-3 py-3.5 text-slate-600">{age !== null ? age : "—"}</td>
                      <td className="px-3 py-3.5"><ConditionBadge conditions={p.conditions} /></td>
                      <td className="px-3 py-3.5 text-slate-600">{fmtDate(p.last_visit)}</td>
                      <td className="px-3 py-3.5"><ActiveBadge active={p.is_active} /></td>
                      <td className="px-3 py-3.5"><AbhaBadge status={p.abhaStatus} /></td>
                      <td className="px-3 py-3.5">
                        <button onClick={() => navigate(`/patients/${p.id}`)}
                          className="flex items-center gap-1.5 text-xs font-semibold
                                     text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50
                                     px-2.5 py-1.5 rounded-lg transition-colors">
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-3 py-12 text-center text-slate-400 text-sm">
                    {query || activeFilterCount > 0
                      ? "No patients match your search or filters."
                      : "No patients yet. Click 'Add Patient' to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          Showing {displayed.length} of {(patients || []).length} patients
        </div>
      </div>


      {modal?.type === "view" && (
        <ViewDetailsModal
          patientId={modal.patientId}
          fetchPatientDetails={fetchPatientDetails}
          onClose={() => setModal(null)}
          onEdit={(details) => openEdit(details)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}