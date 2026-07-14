import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, AlertCircle, Save, Camera, X, Activity } from "lucide-react";
import { useData } from "../context/DataContext";
import SmartDropdown from "../components/SmartDropdown";
import PhotoCapture from "../components/PhotoCapture";

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
  marital_status: "",
  education: "",
  profession: "",
  referred_by: "",
  address_line_1: "",
  address_line_2: "",
  locality: "",
  city: ""
};

export function Field({ label, required, error, children }) {
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

export function MultiSelectDropdown({ label, options, selected, onChange, disabled }) {
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
        <div className={`transition-transform ${open ? "rotate-180" : ""}`}>▼</div>
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

export default function PatientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  
  const { patients, configConditions, configMedicalHistory, addPatient, updatePatient, fetchPatientDetails } = useData();

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(isEdit);

  useEffect(() => {
    async function loadPatient() {
      if (!isEdit) return;
      setLoadingInitial(true);
      try {
        const p = await fetchPatientDetails(id);
        if (p) {
          setForm({
            id: p.metadata.id || "",
            name: p.metadata.name || "",
            date_of_birth: p.metadata.date_of_birth || "",
            contact: p.metadata.contact || "",
            gender: p.metadata.gender || "",
            is_active: p.metadata.is_active ? "true" : "false",
            receive_msgs: p.metadata.receive_msgs ? "true" : "false",
            conditions: p.metadata.conditions || [],
            medical_history: p.metadata.medical_history || [],
            expected_due_date: p.metadata.expected_due_date || "",
            notes: p.notes || "",
            abhaId: p.metadata.abhaId || "",
            marital_status: p.metadata.marital_status || "",
            education: p.metadata.education || "",
            profession: p.metadata.profession || "",
            referred_by: p.metadata.referred_by || "",
            address_line_1: p.metadata.address_line_1 || "",
            address_line_2: p.metadata.address_line_2 || "",
            locality: p.metadata.locality || "",
            city: p.metadata.city || ""
          });
        }
      } catch (e) {
        console.error("Failed to load patient", e);
      } finally {
        setLoadingInitial(false);
      }
    }
    loadPatient();
  }, [id, isEdit, fetchPatientDetails]);

  const generateId = async () => {
    try {
      const res = await fetch("/patient/generate-id");
      const data = await res.json();
      setForm(prev => ({ ...prev, id: data.id }));
    } catch(e) {
      console.error(e);
    }
  };

  const set = (key, val) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const setGender = (gender) => {
    setForm((p) => ({
      ...p,
      gender,
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSaving(true);
    setServerError(null);

    try {
      let finalId = form.id.trim();
      if (!isEdit && !finalId) {
        // Simple client-side fallback if ID isn't fetched
        const maxId = patients.reduce((max, p) => Math.max(max, parseInt(p.id) || 0), 0);
        finalId = String(maxId + 1).padStart(6, '0');
      }

      const payload = {
        ...form,
        id: finalId,
        is_active: form.is_active === "true" || form.is_active === true,
        receive_msgs: form.receive_msgs === "true" || form.receive_msgs === true,
      };

      if (isEdit) {
        await updatePatient(finalId, payload);
      } else {
        await addPatient(payload);
      }

      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        await fetch(`/patient/${finalId}/photo`, {
          method: "POST",
          body: formData,
        });
      }
      
      navigate(isEdit ? `/patients/${finalId}` : '/patients');
    } catch (err) {
      setServerError(err.message);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass = (hasError) =>
    `w-full px-3 py-2 text-sm border rounded-xl transition
     focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
     ${hasError ? "border-rose-300 bg-rose-50 text-slate-700" : "border-slate-200 bg-white text-slate-700"}`;

  if (loadingInitial) {
    return <div className="p-8 flex justify-center"><div className="animate-spin text-indigo-600"><Activity size={24} /></div></div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800">
          <ArrowLeft size={16} className="mr-2" /> Back
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEdit ? "Edit Patient" : "Add New Patient"}
        </h1>
      </div>

      {serverError && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-600 flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <p>{serverError}</p>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Photo Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <PhotoCapture
            currentPhotoUrl={isEdit ? `/patient/${form.id}/photo?t=${Date.now()}` : "/patient/default/photo"}
            onPhotoSelected={(file) => { setPhotoFile(file); }}
          />
        </div>

        {/* Basic Details Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Patient ID" error={errors.id}>
              <div className="flex gap-2">
                <input
                  value={form.id}
                  onChange={(e) => set("id", e.target.value)}
                  placeholder="Auto-generated if empty"
                  className={inputClass(!!errors.id)}
                  disabled={isEdit}
                />
                {!isEdit && (
                  <button type="button" onClick={generateId} className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl whitespace-nowrap transition">
                    Generate
                  </button>
                )}
              </div>
            </Field>

            <Field label="Full Name" required error={errors.name}>
              <input
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Patient's full name"
                className={inputClass(!!errors.name)}
              />
            </Field>

            <Field label="Date of Birth" error={errors.date_of_birth}>
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
                className={inputClass(!!errors.date_of_birth)}
              />
            </Field>

            <Field label="Contact Number" required error={errors.contact}>
              <input
                value={form.contact}
                onChange={(e) => set("contact", e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="10-digit mobile number"
                className={inputClass(!!errors.contact)}
              />
            </Field>

            <Field label="Gender" required error={errors.gender}>
              <select
                value={form.gender}
                onChange={(e) => setGender(e.target.value)}
                className={inputClass(!!errors.gender)}
              >
                <option value="">Select Gender</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
                <option value="Other">Other</option>
              </select>
            </Field>

            <Field label="ABHA ID (Optional)" error={errors.abhaId}>
              <input
                value={form.abhaId}
                onChange={(e) => set("abhaId", e.target.value)}
                placeholder="xx-xxxx-xxxx-xxxx"
                className={inputClass(!!errors.abhaId)}
              />
            </Field>

            <Field label="Active Status" required error={errors.is_active}>
              <select
                value={form.is_active}
                onChange={(e) => set("is_active", e.target.value)}
                className={inputClass(!!errors.is_active)}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </Field>

            <Field label="Receive WhatsApp Msgs" required error={errors.receive_msgs}>
              <select
                value={form.receive_msgs}
                onChange={(e) => set("receive_msgs", e.target.value)}
                className={inputClass(!!errors.receive_msgs)}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Other Details Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Other Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Marital Status">
              <SmartDropdown 
                fieldKey="marital_status" 
                value={form.marital_status} 
                onChange={(val) => set("marital_status", val)} 
                placeholder="Select or type..." 
              />
            </Field>
            
            <Field label="Education">
              <SmartDropdown 
                fieldKey="education" 
                value={form.education} 
                onChange={(val) => set("education", val)} 
                placeholder="Select or type..." 
              />
            </Field>
            
            <Field label="Profession">
              <SmartDropdown 
                fieldKey="profession" 
                value={form.profession} 
                onChange={(val) => set("profession", val)} 
                placeholder="Select or type..." 
              />
            </Field>
            
            <Field label="Referred By">
              <SmartDropdown 
                fieldKey="referred_by" 
                value={form.referred_by} 
                onChange={(val) => set("referred_by", val)} 
                placeholder="Select or type..." 
              />
            </Field>
          </div>
        </div>

        {/* Address Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Address Line 1">
              <input
                value={form.address_line_1}
                onChange={(e) => set("address_line_1", e.target.value)}
                placeholder="Street address, PO Box, etc."
                className={inputClass(false)}
              />
            </Field>
            <Field label="Address Line 2">
              <input
                value={form.address_line_2}
                onChange={(e) => set("address_line_2", e.target.value)}
                placeholder="Apt, Suite, Unit, Building (optional)"
                className={inputClass(false)}
              />
            </Field>
            <Field label="Locality">
              <SmartDropdown 
                fieldKey="locality" 
                value={form.locality} 
                onChange={(val) => set("locality", val)} 
                placeholder="Neighborhood / Area" 
              />
            </Field>
            <Field label="City">
              <SmartDropdown 
                fieldKey="city" 
                value={form.city} 
                onChange={(val) => set("city", val)} 
                placeholder="City" 
              />
            </Field>
          </div>
        </div>

        {/* Medical Setup Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Medical Setup</h2>
          <div className="grid grid-cols-1 gap-4">
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

            <Field label="Medical History" error={errors.medical_history}>
              <MultiSelectDropdown
                label="Medical History"
                disabled={!form.gender}
                options={configMedicalHistory
                  .filter(m => m.gender === "Both" || m.gender === (form.gender === 'F' ? 'Female' : form.gender === 'M' ? 'Male' : ''))
                  .map(m => ({ label: m.name, value: m.code }))
                }
                selected={form.medical_history || []}
                onChange={(selected) => setForm({ ...form, medical_history: selected })}
              />
            </Field>

            {(() => {
              const hasPregnancy = (form.conditions || []).some(code => {
                const cond = configConditions.find(c => c.code === code);
                return cond && cond.name.toLowerCase().includes("pregnancy");
              });

              if (!hasPregnancy) return null;

              return (
                <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <Field label="Expected Due Date (EDD)" required={false} error={errors.expected_due_date}>
                    <input
                      type="date"
                      value={form.expected_due_date}
                      onChange={(e) => set("expected_due_date", e.target.value)}
                      className={inputClass(!!errors.expected_due_date)}
                    />
                    <p className="mt-1.5 text-xs text-indigo-600 font-medium">EDD is used to schedule automated pregnancy messages.</p>
                  </Field>
                </div>
              );
            })()}

            <Field label="General Notes">
              <textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="Any additional notes..."
                className={`${inputClass(false)} h-24 resize-none`}
              />
            </Field>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 flex justify-end gap-3 z-30 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {saving ? (
            <><Activity size={18} className="animate-spin" /> Saving...</>
          ) : (
            <><Save size={18} /> {isEdit ? "Update Patient" : "Save Patient"}</>
          )}
        </button>
      </div>
    </div>
  );
}
