// @refresh reset
// src/context/DataContext.jsx

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";

const DataContext = createContext(null);

function nextPatientId(patients) {
  const nums = patients
    .map((p) => parseInt(p.id, 10))
    .filter((n) => !isNaN(n) && n >= 100000 && n <= 999999);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 100001;
  return String(Math.min(next, 999999));
}

export function DataProvider({ children }) {
  const [patients,  setPatients]  = useState(null);
  const [configConditions, setConfigConditions] = useState(null);
  const [configMedicalHistory, setConfigMedicalHistory] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // ── Load patients from FastAPI ──────────────────────────────────────────────
  const refreshPatients = useCallback(async () => {
    try {
      const res = await fetch("/patient/view/md");
      if (!res.ok) throw new Error(`GET /patient/view/md → ${res.status}`);
      setPatients(await res.json());
      setError(null);
    } catch (err) {
      console.error("Failed to load patients:", err);
      setError(err.message);
      setPatients([]);
    }
  }, []);


  // ── Load Configs from FastAPI ──────────────────────────────────────────────
  const refreshConfig = useCallback(async () => {
    try {
      const [condRes, medRes] = await Promise.all([
        fetch("/config/conditions"),
        fetch("/config/medical-history")
      ]);
      if (condRes.ok) setConfigConditions(await condRes.json());
      if (medRes.ok) setConfigMedicalHistory(await medRes.json());
    } catch (err) {
      console.error("Failed to load config:", err);
      setConfigConditions([]);
      setConfigMedicalHistory([]);
    }
  }, []);

  useEffect(() => {
    Promise.all([refreshPatients(), refreshConfig()])
      .finally(() => setLoading(false));
  }, [refreshPatients, refreshConfig]);

  // ── Build Patient JSON from form data ───────────────────────────────────────
  const buildPatientJson = (formData, existingId) => {
    const id = existingId || formData.id || nextPatientId(patients || []);
    return {
      metadata: {
        id,
        name:          formData.name,
        contact:       formData.contact,
        altContact:    formData.altContact,
        date_of_birth: formData.date_of_birth || "",
        gender:        formData.gender || "",
        is_active:     typeof formData.is_active === "boolean"
                   ? formData.is_active
                   : formData.is_active === "true",
        receive_msgs:  typeof formData.receive_msgs === "boolean"
                   ? formData.receive_msgs
                   : formData.receive_msgs !== "false",
        last_visit:    formData.last_visit || "",
        expected_due_date: formData.expected_due_date || "",
        conditions:    formData.conditions || [],
        medical_history: formData.medical_history || [],
        abhaId:             formData.abhaId || "",
        abhaStatus:         formData.abhaStatus || "Not Linked",
        abhaLinked:         formData.abhaLinked || false,
        abhaLinkedOn:       formData.abhaLinkedOn || null,
        lastSync:           formData.lastSync || null,
        consentStatus:      formData.consentStatus || "Not Requested",
        consentRequestedOn: formData.consentRequestedOn || null,
        abhaProfile:        formData.abhaProfile || {},
      },
      visits:         formData.visits         || [],
      due_date:       formData.due_date || null,
      notes:          formData.notes          || "",
    };
  };

  // ── Add patient ─────────────────────────────────────────────────────────────
  const addPatient = useCallback(async (formData) => {
    const body = buildPatientJson(formData, null);
    const res  = await fetch("/patient/add/det", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to add patient");
    }
    await refreshPatients();
  }, [patients, refreshPatients]);

  // ── Update patient ──────────────────────────────────────────────────────────
  const updatePatient = useCallback(async (formData) => {
    const body = buildPatientJson(formData, formData.id);
    const res  = await fetch(`/patient/edit/det/${formData.id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update patient");
    }
    await refreshPatients();
  }, [refreshPatients]);

  // ── Delete patient ──────────────────────────────────────────────────────────
  const deletePatient = useCallback(async (id) => {
    const res = await fetch(`/patient/remove/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to delete patient");
    }
    await refreshPatients();
  }, [refreshPatients]);

  // ── Fetch full patient details ──────────────────────────────────────────────
  const fetchPatientDetails = useCallback(async (id) => {
    const res = await fetch(`/patient/view/det/${id}`);
    if (!res.ok) throw new Error(`Patient ${id} not found`);
    return res.json();
  }, []);

  const isLoaded = patients !== null;

  return (
    <DataContext.Provider value={{
      patients, configConditions, configMedicalHistory, loading, error, isLoaded,
      refreshPatients, refreshConfig, addPatient, updatePatient, deletePatient,
      fetchPatientDetails,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used inside <DataProvider>");
  return ctx;
}