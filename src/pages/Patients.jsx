// src/pages/Patients.jsx
//
// Patient management page — data lives in DataContext (backed by Excel).
// Add / Edit changes are written back to the Excel file automatically.

import { useState } from "react";
import { Search, UserPlus, Pencil, X, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generatePatientId(patients) {
  const nums = patients
    .map((p) => parseInt(p.id.replace("P-", ""), 10))
    .filter((n) => !isNaN(n));
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 101;
  return `P-${next}`;
}

const EMPTY_FORM = { id: "", name: "", contact: "", dueDate: "", active: "" };

// ─── Active Badge ─────────────────────────────────────────────────────────────
function ActiveBadge({ active }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {active ? "Yes" : "No"}
    </span>
  );
}

// ─── Field ────────────────────────────────────────────────────────────────────
function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
        {required && <span className="text-rose-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
          <AlertCircle size={11} /> {error}
        </p>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function PatientModal({ mode, initial, patients, onSave, onClose }) {
  const [form,   setForm]   = useState({ ...initial });
  const [errors, setErrors] = useState({});

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())    e.name    = "Patient name is required.";
    if (!form.contact.trim()) e.contact = "Contact number is required.";
    else if (!/^\d{10}$/.test(form.contact.trim()))
      e.contact = "Enter a valid 10-digit number.";
    if (form.active === "") e.active = "Please select Active status.";
    if (mode === "add" && form.id.trim()) {
      const exists = patients.some(
        (p) => p.id.toLowerCase() === form.id.trim().toLowerCase()
      );
      if (exists) e.id = "This Patient ID already exists.";
    }
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const finalId = form.id.trim() !== "" ? form.id.trim() : generatePatientId(patients);
    onSave({
      id:           finalId,
      name:         form.name.trim(),
      contact:      form.contact.trim(),
      dueDate:      form.dueDate.trim() || "N/A",
      lastWeekSent: mode === "add" ? "N/A" : initial.lastWeekSent,
      active:       form.active === "true",
    });
  };

  const isEdit = mode === "edit";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">
            {isEdit ? "Edit Patient" : "Add New Patient"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          <Field label="Patient ID" error={errors.id}>
            <input
              type="text"
              placeholder={isEdit ? "" : "Leave blank to auto-generate"}
              value={form.id}
              onChange={(e) => set("id", e.target.value)}
              disabled={isEdit}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                ${isEdit
                  ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : errors.id ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"
                }`}
            />
          </Field>

          <Field label="Patient Name" required error={errors.name}>
            <input
              type="text"
              placeholder="e.g. Priya Sharma"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                ${errors.name ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
            />
          </Field>

          <Field label="Contact Number" required error={errors.contact}>
            <input
              type="tel"
              placeholder="10-digit mobile number"
              value={form.contact}
              onChange={(e) => set("contact", e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                ${errors.contact ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
            />
          </Field>

          <Field label="Due Date" error={errors.dueDate}>
            <input
              type="text"
              placeholder="DD/MM/YY (optional)"
              value={form.dueDate}
              onChange={(e) => set("dueDate", e.target.value)}
              className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl
                         bg-white text-slate-700 focus:outline-none focus:ring-2
                         focus:ring-indigo-400 focus:border-transparent transition"
            />
          </Field>

          <Field label="Active" required error={errors.active}>
            <select
              value={form.active}
              onChange={(e) => set("active", e.target.value)}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                ${errors.active ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <option value="">Select…</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </Field>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600
                       hover:bg-indigo-700 rounded-xl shadow-sm transition"
          >
            {isEdit ? "Save Changes" : "Add Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Patients() {
  const { patients, addPatient, updatePatient } = useData();
  const [query, setQuery] = useState("");
  const [modal, setModal] = useState(null);

  if (!patients) {
    return <p className="text-slate-400 text-sm">Loading patient data…</p>;
  }

  const filtered = patients.filter((p) => {
    const q = query.toLowerCase();
    return (
      p.id.toLowerCase().includes(q) ||
      p.name.toLowerCase().includes(q) ||
      p.contact.includes(q)
    );
  });

  const handleAdd = (data) => {
    addPatient(data);
    setModal(null);
  };

  const handleEdit = (data) => {
    updatePatient(data);
    setModal(null);
  };

  const openEdit = (patient) => {
    setModal({
      mode: "edit",
      patient: {
        ...patient,
        active:  String(patient.active),
        dueDate: patient.dueDate === "N/A" ? "" : patient.dueDate,
      },
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patients</h1>
        <p className="mt-1 text-slate-500">Manage and view all registered patients. Changes are saved to your Excel file automatically.</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-5">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, ID or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl
                       bg-white shadow-sm text-slate-700 placeholder-slate-400
                       focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition"
          />
        </div>
        <button
          onClick={() => setModal({ mode: "add" })}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                     text-white text-sm font-semibold px-4 py-2.5 rounded-xl
                     shadow-sm transition-colors duration-150 whitespace-nowrap"
        >
          <UserPlus size={16} />
          Add Patient
        </button>
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
                <th className="px-5 py-3 font-semibold">Due Date</th>
                <th className="px-5 py-3 font-semibold">Last Week Sent</th>
                <th className="px-5 py-3 font-semibold">Active</th>
                <th className="px-5 py-3 font-semibold">Edit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length > 0 ? (
                filtered.map((patient) => (
                  <tr key={patient.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{patient.id}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{patient.name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{patient.contact}</td>
                    <td className="px-5 py-3.5 text-slate-600">{patient.dueDate}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {patient.lastWeekSent === "N/A"
                        ? <span className="text-slate-400 font-mono text-xs">N/A</span>
                        : `Week ${patient.lastWeekSent}`}
                    </td>
                    <td className="px-5 py-3.5"><ActiveBadge active={patient.active} /></td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(patient)}
                        className="flex items-center gap-1.5 text-xs font-semibold
                                   text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50
                                   px-2.5 py-1.5 rounded-lg transition-colors"
                      >
                        <Pencil size={13} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-400 text-sm">
                    {query ? `No patients found matching "${query}".` : "No patients yet. Click 'Add Patient' to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          Showing {filtered.length} of {patients.length} patients
        </div>
      </div>

      {/* Modals */}
      {modal?.mode === "add" && (
        <PatientModal mode="add" initial={EMPTY_FORM} patients={patients} onSave={handleAdd} onClose={() => setModal(null)} />
      )}
      {modal?.mode === "edit" && (
        <PatientModal mode="edit" initial={modal.patient} patients={patients} onSave={handleEdit} onClose={() => setModal(null)} />
      )}
    </div>
  );
}