// src/pages/Patients.jsx
// Patient data now comes from FastAPI backend.
// Field names match the Python models exactly:
//   PatientMetaData: id, name, age, number, is_active, last_visit
//   Patient (details): metadata, visits, follow_up_date, total_fees_paid, fees_unpaid, notes

import { useState, useMemo } from "react";
import {
  Search, UserPlus, Eye, Pencil, Trash2, X, AlertCircle,
  ArrowUpDown, Filter, ChevronDown, ArrowUp, ArrowDown, Loader2,
} from "lucide-react";
import { useData } from "../context/DataContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generatePatientId(patients) {
  const nums = patients
    .map((p) => parseInt(p.id, 10))
    .filter((n) => !isNaN(n) && n >= 100000 && n <= 999999);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 100001;
  return String(Math.min(next, 999999));
}

// DD-MM-YY or DD-MM-YYYY → display as-is (already formatted by backend)
function fmtDate(str) {
  if (!str || str === "") return "—";
  return str;
}

// ─── Badges ───────────────────────────────────────────────────────────────────
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

// ─── Patient Form (Add / Edit) ────────────────────────────────────────────────
const EMPTY_FORM = {
  id: "", name: "", age: "", number: "", is_active: "",
  last_visit: "", follow_up_date: "", total_fees_paid: "",
  fees_unpaid: "", notes: "",
};

function PatientForm({ title, initial, isEdit, patients, onSave, onClose }) {
  const [form,   setForm]   = useState({ ...initial });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!isEdit && form.id.trim() !== "") {
      if (!/^\d{6}$/.test(form.id.trim())) e.id = "Must be exactly 6 digits.";
      else if (patients.some((p) => p.id === form.id.trim())) e.id = "ID already exists.";
    }
    if (!form.name.trim())   e.name   = "Name is required.";
    if (!form.number.trim()) e.number = "Contact number is required.";
    else if (!/^\d{10}$/.test(form.number.trim())) e.number = "Must be 10 digits.";
    if (form.age !== "" && (isNaN(Number(form.age)) || Number(form.age) <= 0 || Number(form.age) > 120))
      e.age = "Enter a valid age (1–120).";
    if (form.is_active === "") e.is_active = "Please select a status.";
    if (form.total_fees_paid !== "" && isNaN(Number(form.total_fees_paid)))
      e.total_fees_paid = "Must be a number.";
    if (form.fees_unpaid !== "" && isNaN(Number(form.fees_unpaid)))
      e.fees_unpaid = "Must be a number.";
    return e;
  };

  const handleSubmit = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setSaving(true);
    setServerError(null);
    try {
      const finalId = isEdit
        ? initial.id
        : (form.id.trim() !== "" ? form.id.trim() : generatePatientId(patients));
      await onSave({ ...form, id: finalId, is_active: form.is_active === "true" });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

          {serverError && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-xs text-rose-700 font-medium">
              {serverError}
            </div>
          )}

          {/* Patient ID */}
          <Field label="Patient ID" error={errors.id}>
            <input type="text" inputMode="numeric" maxLength={6}
              value={form.id}
              onChange={(e) => set("id", e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder={isEdit ? "" : "6-digit number (auto if blank)"}
              disabled={isEdit}
              className={`w-full px-3 py-2 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                ${isEdit ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                  : errors.id ? "border-rose-300 bg-rose-50 text-slate-700"
                  : "border-slate-200 bg-white text-slate-700"}`}
            />
          </Field>

          {/* Name + Number */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Name" required error={errors.name}>
              <input type="text" value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Full name"
                className={`w-full px-3 py-2 text-sm border rounded-xl transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                  ${errors.name ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
              />
            </Field>
            <Field label="Contact Number" required error={errors.number}>
              <input type="tel" value={form.number}
                onChange={(e) => set("number", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit number" inputMode="numeric"
                className={`w-full px-3 py-2 text-sm border rounded-xl transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                  ${errors.number ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
              />
            </Field>
          </div>

          {/* Age + Active */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Age" error={errors.age}>
              <input type="text" value={form.age}
                onChange={(e) => set("age", e.target.value.replace(/\D/g, "").slice(0, 3))}
                placeholder="Years" inputMode="numeric"
                className={`w-full px-3 py-2 text-sm border rounded-xl transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                  ${errors.age ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
              />
            </Field>
            <Field label="Active Status" required error={errors.is_active}>
              <select value={form.is_active}
                onChange={(e) => set("is_active", e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-xl bg-white text-slate-700
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition
                  ${errors.is_active ? "border-rose-300 bg-rose-50" : "border-slate-200"}`}>
                <option value="">Select…</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>
          </div>

          {/* Last Visit + Follow-up Date */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Last Visit (DD-MM-YY)">
              <input type="text" value={form.last_visit}
                onChange={(e) => set("last_visit", e.target.value)}
                placeholder="e.g. 15-06-25"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white
                           text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400
                           focus:border-transparent transition"
              />
            </Field>
            <Field label="Follow-up Date (DD-MM-YYYY)">
              <input type="text" value={form.follow_up_date}
                onChange={(e) => set("follow_up_date", e.target.value)}
                placeholder="e.g. 15-06-2025"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white
                           text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400
                           focus:border-transparent transition"
              />
            </Field>
          </div>

          {/* Fees */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Total Fees Paid (₹)" error={errors.total_fees_paid}>
              <input type="text" value={form.total_fees_paid}
                onChange={(e) => set("total_fees_paid", e.target.value)}
                placeholder="0.00" inputMode="decimal"
                className={`w-full px-3 py-2 text-sm border rounded-xl transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                  ${errors.total_fees_paid ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
              />
            </Field>
            <Field label="Fees Unpaid (₹)" error={errors.fees_unpaid}>
              <input type="text" value={form.fees_unpaid}
                onChange={(e) => set("fees_unpaid", e.target.value)}
                placeholder="0.00" inputMode="decimal"
                className={`w-full px-3 py-2 text-sm border rounded-xl transition
                  focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                  ${errors.fees_unpaid ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
              />
            </Field>
          </div>

          {/* Notes */}
          <Field label="Notes">
            <textarea value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3} placeholder="Clinical notes, remarks…"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white
                         text-slate-700 resize-y focus:outline-none focus:ring-2
                         focus:ring-indigo-400 focus:border-transparent transition"
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose} disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                       bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition disabled:opacity-50">
            {saving && <Loader2 size={13} className="animate-spin" />}
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

function ViewDetailsModal({ patientId, onClose, onEdit, onDelete, fetchPatientDetails }) {
  const [details,       setDetails]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  // Fetch full details on mount
  useState(() => {
    fetchPatientDetails(patientId)
      .then(setDetails)
      .catch(console.error)
      .finally(() => setLoading(false));
  });

  // useEffect to load on mount
  const [loaded, setLoaded] = useState(false);
  if (!loaded) {
    fetchPatientDetails(patientId)
      .then((d) => { setDetails(d); setLoading(false); setLoaded(true); })
      .catch(() => setLoading(false));
  }

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(patientId);
  };

  const md = details?.metadata;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-auto">

        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">{md?.name ?? "Loading…"}</h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {patientId}</p>
          </div>
          <div className="flex items-center gap-2">
            {details && (
              <>
                <button onClick={() => onEdit(details)}
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
                  <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-3 py-1.5">
                    <span className="text-xs text-rose-700 font-semibold">Confirm?</span>
                    <button onClick={handleDelete} disabled={deleting}
                      className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700
                                 px-2 py-1 rounded-lg transition disabled:opacity-50">
                      {deleting ? "…" : "Yes"}
                    </button>
                    <button onClick={() => setConfirmDelete(false)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 transition">
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
          {loading ? (
            <div className="flex items-center gap-2 text-slate-400 py-8 justify-center">
              <Loader2 size={16} className="animate-spin" /> Loading details…
            </div>
          ) : details ? (
            <>
              <DetailRow label="Patient ID"     value={md.id} />
              <DetailRow label="Name"           value={md.name} />
              <DetailRow label="Contact"        value={md.number} />
              <DetailRow label="Age"            value={md.age ? `${md.age} years` : "—"} />
              <DetailRow label="Status"         value={md.is_active ? "Active" : "Inactive"} />
              <DetailRow label="Last Visit"     value={fmtDate(md.last_visit)} />
              <DetailRow label="Follow-up Date" value={fmtDate(details.follow_up_date)} />
              <DetailRow label="Fees Paid"      value={details.total_fees_paid ? `₹${details.total_fees_paid.toFixed(2)}` : "—"} />
              <DetailRow label="Fees Unpaid"    value={details.fees_unpaid     ? `₹${details.fees_unpaid.toFixed(2)}`     : "—"} />
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

        <div className="px-6 py-4 border-t border-slate-100 flex justify-end">
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
  const { patients, addPatient, updatePatient, deletePatient, fetchPatientDetails, loading, error } = useData();

  const [query,        setQuery]        = useState("");
  const [sortKey,      setSortKey]      = useState("last_visit");
  const [sortDir,      setSortDir]      = useState("desc");
  const [filterOpen,   setFilterOpen]   = useState(false);
  const [filterActive, setFilterActive] = useState("all");
  const [ageMin,       setAgeMin]       = useState("");
  const [ageMax,       setAgeMax]       = useState("");
  const [modal,        setModal]        = useState(null);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const activeFilterCount =
    (filterActive !== "all" ? 1 : 0) +
    (ageMin !== "" || ageMax !== "" ? 1 : 0);

  const clearFilters = () => { setFilterActive("all"); setAgeMin(""); setAgeMax(""); };

  const displayed = useMemo(() => {
    let list = [...(patients || [])];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.id.includes(q) ||
        p.number.includes(q)
      );
    }

    if (filterActive === "active")   list = list.filter((p) =>  p.is_active);
    if (filterActive === "inactive") list = list.filter((p) => !p.is_active);

    if (ageMin !== "") list = list.filter((p) => Number(p.age) >= Number(ageMin));
    if (ageMax !== "") list = list.filter((p) => Number(p.age) <= Number(ageMax));

    list.sort((a, b) => {
      let av, bv;
      if (sortKey === "name")       { av = a.name.toLowerCase();    bv = b.name.toLowerCase(); }
      if (sortKey === "id")         { av = parseInt(a.id, 10) || 0; bv = parseInt(b.id, 10) || 0; }
      if (sortKey === "age")        { av = a.age || 0;              bv = b.age || 0; }
      if (sortKey === "last_visit") {
        // DD-MM-YY → sort as string YYMMDD for correct date order
        const toSortable = (s) => {
          if (!s) return "000000";
          const [d, m, y] = s.split("-");
          return `${y || "00"}${m || "00"}${d || "00"}`;
        };
        av = toSortable(a.last_visit);
        bv = toSortable(b.last_visit);
      }
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });

    return list;
  }, [patients, query, filterActive, ageMin, ageMax, sortKey, sortDir]);

  const handleAdd = async (formData) => {
    await addPatient(formData);
    setModal(null);
  };

  const handleEdit = async (formData) => {
    await updatePatient(formData);
    setModal(null);
  };

  const handleDelete = async (id) => {
    await deletePatient(id);
    setModal(null);
  };

  const openEdit = (details) => {
    // details is full Patient JSON from /patient/view/det
    const md = details.metadata;
    setModal({
      type: "edit",
      initial: {
        id:              md.id,
        name:            md.name,
        age:             String(md.age || ""),
        number:          md.number,
        is_active:       String(md.is_active),
        last_visit:      md.last_visit || "",
        follow_up_date:  details.follow_up_date  || "",
        total_fees_paid: String(details.total_fees_paid || ""),
        fees_unpaid:     String(details.fees_unpaid     || ""),
        notes:           details.notes || "",
        visits:          details.visits || [],
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-16 justify-center">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading patients…</span>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Patients</h1>
        <p className="mt-1 text-slate-500">
          Manage all registered patients. Data is stored via the FastAPI backend.
        </p>
      </div>

      {error && (
        <div className="mb-4 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">Backend connection error</p>
          <p className="font-mono text-xs mt-0.5">{error}</p>
          <p className="text-xs mt-1">Make sure <code>uvicorn main:app --reload --port 8000</code> is running.</p>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-3 mb-5">
        <div className="flex flex-wrap items-center gap-3">

          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search by name, ID or number…"
              value={query} onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl
                         bg-white shadow-sm text-slate-700 placeholder-slate-400
                         focus:outline-none focus:ring-2 focus:ring-indigo-400
                         focus:border-transparent transition" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
              <ArrowUpDown size={12} /> Sort:
            </span>
            <SortButton sortKey="last_visit" currentKey={sortKey} sortDir={sortDir} label="Last Visit"  onClick={handleSort} />
            <SortButton sortKey="name"       currentKey={sortKey} sortDir={sortDir} label="Name"        onClick={handleSort} />
            <SortButton sortKey="id"         currentKey={sortKey} sortDir={sortDir} label="Patient ID"  onClick={handleSort} />
            <SortButton sortKey="age"        currentKey={sortKey} sortDir={sortDir} label="Age"         onClick={handleSort} />
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

          <button onClick={() => setModal({ type: "add" })}
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
                <th className="px-5 py-3 font-semibold">Number</th>
                <th className="px-5 py-3 font-semibold">Age</th>
                <th className="px-5 py-3 font-semibold">Last Visit</th>
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
                    <td className="px-5 py-3.5 text-slate-600">{p.number}</td>
                    <td className="px-5 py-3.5 text-slate-600">{p.age || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(p.last_visit)}</td>
                    <td className="px-5 py-3.5"><ActiveBadge active={p.is_active} /></td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => setModal({ type: "view", patientId: p.id })}
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
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
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
          Showing {displayed.length} of {(patients || []).length} patients
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "add" && (
        <PatientForm title="Add New Patient" initial={EMPTY_FORM} isEdit={false}
          patients={patients || []} onSave={handleAdd} onClose={() => setModal(null)} />
      )}
      {modal?.type === "edit" && (
        <PatientForm title="Edit Patient" initial={modal.initial} isEdit={true}
          patients={patients || []} onSave={handleEdit} onClose={() => setModal(null)} />
      )}
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