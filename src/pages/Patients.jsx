// src/pages/Patients.jsx

import { useState, useMemo } from "react";
import {
  Search, UserPlus, Eye, Pencil, Trash2, X, AlertCircle,
  ArrowUpDown, Filter, ChevronDown, ArrowUp, ArrowDown,
} from "lucide-react";
import { useData } from "../context/DataContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const CONDITIONS = [
  "Pregnancy",
  "Condition 2", "Condition 3", "Condition 4", "Condition 5",
  "Condition 6", "Condition 7", "Condition 8", "Condition 9", "Condition 10",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generatePatientId(patients) {
  const nums = patients
    .map((p) => parseInt(p.id, 10))
    .filter((n) => !isNaN(n) && n >= 100000 && n <= 999999);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 100001;
  return String(Math.min(next, 999999));
}

function fmtDate(str) {
  if (!str || str === "N/A" || str === "") return "—";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

// ─── Small reusable components ────────────────────────────────────────────────
function ActiveBadge({ active }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold
      ${active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
      {active ? "Yes" : "No"}
    </span>
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

function TextInput({ value, onChange, placeholder, disabled, error, ...rest }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm border rounded-xl transition
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
        ${disabled ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" :
          error   ? "border-rose-300 bg-rose-50 text-slate-700" :
                    "border-slate-200 bg-white text-slate-700"}`}
      {...rest}
    />
  );
}

function DateInput({ value, onChange, error }) {
  return (
    <input
      type="date"
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 text-sm border rounded-xl transition
        focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
        ${error ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
    />
  );
}

// ─── Patient Form ─────────────────────────────────────────────────────────────
const EMPTY = {
  id: "", name: "", contact: "", age: "", condition: "",
  dueDate: "", firstAppointment: "", lastAppointment: "",
  diagnosis: "", remarks: "", active: "",
};

function PatientForm({ initial, isEdit, patients, onSave, onClose, title }) {
  const [form,   setForm]   = useState({ ...initial });
  const [errors, setErrors] = useState({});

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!isEdit) {
      if (form.id.trim() !== "") {
        if (!/^\d{6}$/.test(form.id.trim())) e.id = "Must be exactly 6 digits.";
        else if (patients.some((p) => p.id === form.id.trim())) e.id = "ID already exists.";
      }
    }
    if (!form.name.trim())    e.name    = "Name is required.";
    if (!form.contact.trim()) e.contact = "Contact is required.";
    else if (!/^\d{10}$/.test(form.contact.trim())) e.contact = "Must be 10 digits.";
    if (form.age !== "" && (isNaN(Number(form.age)) || Number(form.age) <= 0 || Number(form.age) > 120))
      e.age = "Enter a valid age (1–120).";
    if (form.active === "") e.active = "Please select a status.";
    return e;
  };

  const handleSubmit = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    const finalId = isEdit
      ? initial.id
      : (form.id.trim() !== "" ? form.id.trim() : generatePatientId(patients));
    onSave({
      id:               finalId,
      name:             form.name.trim(),
      contact:          form.contact.trim(),
      age:              form.age.trim(),
      condition:        form.condition,
      dueDate:          form.condition === "Pregnancy" ? form.dueDate : "",
      firstAppointment: form.firstAppointment,
      lastAppointment:  form.lastAppointment,
      diagnosis:        form.diagnosis.trim(),
      remarks:          form.remarks.trim(),
      active:           form.active === "true",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          <Field label="Patient ID" error={errors.id}>
            <TextInput value={form.id}
              onChange={(e) => set("id", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={isEdit ? "" : "6-digit number (auto if blank)"}
              disabled={isEdit} error={errors.id} inputMode="numeric" />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required error={errors.name}>
              <TextInput value={form.name} onChange={(e) => set("name", e.target.value)}
                placeholder="Full name" error={errors.name} />
            </Field>
            <Field label="Contact" required error={errors.contact}>
              <TextInput value={form.contact}
                onChange={(e) => set("contact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number" error={errors.contact} inputMode="numeric" />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" error={errors.age}>
              <TextInput value={form.age}
                onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="Years" error={errors.age} inputMode="numeric" />
            </Field>
            <Field label="Condition">
              <select value={form.condition} onChange={(e) => set("condition", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white
                           text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400
                           focus:border-transparent transition">
                <option value="">Select…</option>
                {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
          </div>

          {form.condition === "Pregnancy" && (
            <Field label="Due Date" error={errors.dueDate}>
              <DateInput value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)}
                error={errors.dueDate} />
            </Field>
          )}

          <Field label="Active Status" required error={errors.active}>
            <select value={form.active} onChange={(e) => set("active", e.target.value)}
              className={`w-full px-3 py-2 text-sm border rounded-xl bg-white text-slate-700
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
                ${errors.active ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}>
              <option value="">Select…</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="First Appointment Date">
              <DateInput value={form.firstAppointment}
                onChange={(e) => set("firstAppointment", e.target.value)} />
            </Field>
            <Field label="Last Appointment Date">
              <DateInput value={form.lastAppointment}
                onChange={(e) => set("lastAppointment", e.target.value)} />
            </Field>
          </div>

          <Field label="Diagnosis">
            <textarea value={form.diagnosis} onChange={(e) => set("diagnosis", e.target.value)}
              rows={2} placeholder="Enter diagnosis details…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white
                         text-slate-700 resize-y focus:outline-none focus:ring-2
                         focus:ring-indigo-400 focus:border-transparent transition" />
          </Field>

          <Field label="Remarks">
            <textarea value={form.remarks} onChange={(e) => set("remarks", e.target.value)}
              rows={2} placeholder="Any additional remarks…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white
                         text-slate-700 resize-y focus:outline-none focus:ring-2
                         focus:ring-indigo-400 focus:border-transparent transition" />
          </Field>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition">Cancel</button>
          <button onClick={handleSubmit}
            className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600
                       hover:bg-indigo-700 rounded-xl shadow-sm transition">
            {isEdit ? "Save Changes" : "Add Patient"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── View Details Modal ───────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-2.5 border-b border-slate-100 last:border-0">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-sm text-slate-800">{value || "—"}</span>
    </div>
  );
}

function ViewDetailsModal({ patient, onClose, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">{patient.name}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {patient.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                         bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition">
              <Pencil size={12} /> Edit
            </button>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                           bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition">
                <Trash2 size={12} /> Delete
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-200
                              rounded-xl px-3 py-1.5">
                <span className="text-xs text-rose-700 font-semibold">Confirm?</span>
                <button onClick={onDelete}
                  className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700
                             px-2 py-1 rounded-lg transition">Yes</button>
                <button onClick={() => setConfirmDelete(false)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition">No</button>
              </div>
            )}
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition ml-1">
              <X size={18} />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 max-h-[65vh] overflow-y-auto">
          <DetailRow label="Patient ID"        value={patient.id} />
          <DetailRow label="Name"              value={patient.name} />
          <DetailRow label="Contact"           value={patient.contact} />
          <DetailRow label="Age"               value={patient.age ? `${patient.age} years` : "—"} />
          <DetailRow label="Condition"         value={patient.condition} />
          {patient.condition === "Pregnancy" && (
            <DetailRow label="Due Date"        value={fmtDate(patient.dueDate)} />
          )}
          <DetailRow label="Status"            value={patient.active ? "Active" : "Inactive"} />
          <DetailRow label="First Appointment" value={fmtDate(patient.firstAppointment)} />
          <DetailRow label="Last Appointment"  value={fmtDate(patient.lastAppointment)} />
          <div className="py-2.5 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Diagnosis</span>
            <p className="text-sm text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">{patient.diagnosis || "—"}</p>
          </div>
          <div className="py-2.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Remarks</span>
            <p className="text-sm text-slate-800 mt-1 leading-relaxed whitespace-pre-wrap">{patient.remarks || "—"}</p>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Sort button ──────────────────────────────────────────────────────────────
function SortButton({ sortKey, sortDir, currentKey, label, onClick }) {
  const active = currentKey === sortKey;
  return (
    <button onClick={() => onClick(sortKey)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
        border transition whitespace-nowrap
        ${active
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-600"}`}>
      {active
        ? sortDir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        : <ArrowUpDown size={12} className="text-slate-400" />}
      {label}
    </button>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Patients() {
  const { patients, addPatient, updatePatient, deletePatient } = useData();

  const [query,   setQuery]   = useState("");
  // Default sort: last appointment date descending (most recent first)
  const [sortKey, setSortKey] = useState("lastAppointment");
  const [sortDir, setSortDir] = useState("desc");

  const [filterOpen,          setFilterOpen]          = useState(false);
  const [selectedConditions,  setSelectedConditions]  = useState([]);
  const [filterActive,        setFilterActive]        = useState("all"); // "all" | "active" | "inactive"
  const [ageMin,              setAgeMin]              = useState("");
  const [ageMax,              setAgeMax]              = useState("");

  const [modal, setModal] = useState(null);

  if (!patients) return <p className="text-slate-400 text-sm">Loading patient data…</p>;

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir(key === "lastAppointment" ? "desc" : "asc"); }
  };

  const toggleCondition = (c) =>
    setSelectedConditions((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );

  const activeFilterCount =
    selectedConditions.length +
    (filterActive !== "all" ? 1 : 0) +
    (ageMin !== "" || ageMax !== "" ? 1 : 0);

  const clearFilters = () => {
    setSelectedConditions([]);
    setFilterActive("all");
    setAgeMin("");
    setAgeMax("");
  };

  const displayed = useMemo(() => {
    let list = [...patients];

    // Search
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.includes(q) ||
        p.contact.includes(q)
      );
    }

    // Condition filter
    if (selectedConditions.length > 0)
      list = list.filter((p) => selectedConditions.includes(p.condition));

    // Active filter
    if (filterActive === "active")   list = list.filter((p) =>  p.active);
    if (filterActive === "inactive") list = list.filter((p) => !p.active);

    // Age filter
    if (ageMin !== "") list = list.filter((p) => Number(p.age) >= Number(ageMin));
    if (ageMax !== "") list = list.filter((p) => Number(p.age) <= Number(ageMax));

    // Sort
    list.sort((a, b) => {
      let av, bv;
      if (sortKey === "name")            { av = a.name.toLowerCase();             bv = b.name.toLowerCase(); }
      if (sortKey === "id")              { av = parseInt(a.id, 10)  || 0;         bv = parseInt(b.id, 10)  || 0; }
      if (sortKey === "age")             { av = parseInt(a.age, 10) || 0;         bv = parseInt(b.age, 10) || 0; }
      if (sortKey === "lastAppointment") {
        av = a.lastAppointment ? new Date(a.lastAppointment) : new Date(0);
        bv = b.lastAppointment ? new Date(b.lastAppointment) : new Date(0);
        return sortDir === "asc" ? av - bv : bv - av;
      }
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    return list;
  }, [patients, query, selectedConditions, filterActive, ageMin, ageMax, sortKey, sortDir]);

  const handleAdd    = (data) => { addPatient(data);    setModal(null); };
  const handleEdit   = (data) => { updatePatient(data); setModal(null); };
  const handleDelete = (id)   => { deletePatient(id);   setModal(null); };

  const openView = (p) => setModal({ type: "view", patient: p });
  const openAdd  = ()  => setModal({ type: "add" });
  const openEdit = (p) => setModal({ type: "edit", patient: { ...p, active: String(p.active) } });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patients</h1>
        <p className="mt-1 text-slate-500">
          Manage all registered patients. Changes are saved to your Excel file automatically.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by name, ID or phone…"
              value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl
                         bg-white shadow-sm text-slate-700 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400
                         focus:border-transparent transition" />
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <ArrowUpDown size={12} /> Sort:
            </span>
            <SortButton sortKey="lastAppointment" currentKey={sortKey} sortDir={sortDir} label="Last Appt"   onClick={handleSort} />
            <SortButton sortKey="name"            currentKey={sortKey} sortDir={sortDir} label="Name"        onClick={handleSort} />
            <SortButton sortKey="id"              currentKey={sortKey} sortDir={sortDir} label="Patient ID"  onClick={handleSort} />
            <SortButton sortKey="age"             currentKey={sortKey} sortDir={sortDir} label="Age"         onClick={handleSort} />
          </div>

          {/* Filter */}
          <div className="relative">
            <button onClick={() => setFilterOpen((o) => !o)}
              className={`flex items-center gap-2 px-3 py-2.5 text-sm font-semibold
                border rounded-xl transition whitespace-nowrap
                ${activeFilterCount > 0
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
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
                              rounded-xl shadow-lg p-4 w-64 space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">Filters</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold">
                      Clear all
                    </button>
                  )}
                </div>

                {/* Active status */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Status</p>
                  <div className="flex gap-2">
                    {[["all","All"],["active","Active"],["inactive","Inactive"]].map(([val, lbl]) => (
                      <button key={val} onClick={() => setFilterActive(val)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border transition
                          ${filterActive === val
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Age range */}
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

                {/* Condition */}
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-1.5">Condition</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {CONDITIONS.map((c) => (
                      <label key={c} className="flex items-center gap-2 px-2 py-1.5 rounded-lg
                                                hover:bg-slate-50 cursor-pointer">
                        <input type="checkbox" checked={selectedConditions.includes(c)}
                          onChange={() => toggleCondition(c)} className="accent-indigo-600" />
                        <span className="text-sm text-slate-700">{c}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Add Patient */}
          <button onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700
                       text-white text-sm font-semibold px-4 py-2.5 rounded-xl
                       shadow-sm transition-colors whitespace-nowrap">
            <UserPlus size={15} />
            Add Patient
          </button>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedConditions.map((c) => (
              <span key={c} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700
                                       text-xs font-semibold px-2.5 py-1 rounded-full">
                {c}
                <button onClick={() => toggleCondition(c)} className="hover:text-indigo-900"><X size={11} /></button>
              </span>
            ))}
            {filterActive !== "all" && (
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700
                               text-xs font-semibold px-2.5 py-1 rounded-full">
                {filterActive === "active" ? "Active only" : "Inactive only"}
                <button onClick={() => setFilterActive("all")} className="hover:text-green-900"><X size={11} /></button>
              </span>
            )}
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
                <th className="px-5 py-3 font-semibold">Condition</th>
                <th className="px-5 py-3 font-semibold">Last Appointment</th>
                <th className="px-5 py-3 font-semibold">Active</th>
                <th className="px-5 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayed.length > 0 ? (
                displayed.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{p.id}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{p.name}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.contact}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.age || "—"}</td>
                    <td className="px-5 py-3.5">
                      {p.condition
                        ? <span className="inline-flex items-center px-2.5 py-0.5 rounded-full
                                           text-xs font-semibold bg-teal-50 text-teal-700">{p.condition}</span>
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(p.lastAppointment)}</td>
                    <td className="px-5 py-3.5"><ActiveBadge active={p.active} /></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => openView(p)}
                        className="flex items-center gap-1.5 text-xs font-semibold
                                   text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50
                                   px-2.5 py-1.5 rounded-lg transition-colors">
                        <Eye size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                    {query || activeFilterCount > 0
                      ? "No patients match your search or filters."
                      : "No patients yet. Click 'Add Patient' to get started."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          Showing {displayed.length} of {patients.length} patients
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "add" && (
        <PatientForm title="Add New Patient" initial={EMPTY} isEdit={false}
          patients={patients} onSave={handleAdd} onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit" && (
        <PatientForm title="Edit Patient" initial={modal.patient} isEdit={true}
          patients={patients} onSave={handleEdit} onClose={() => setModal(null)} />
      )}
      {modal?.type === "view" && (
        <ViewDetailsModal patient={modal.patient} onClose={() => setModal(null)}
          onEdit={() => setModal({ type: "edit", patient: { ...modal.patient, active: String(modal.patient.active) } })}
          onDelete={() => handleDelete(modal.patient.id)} />
      )}
    </div>
  );
}