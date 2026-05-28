// src/context/DataContext.jsx

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { buildDefaultTemplates } from "../utils/excelStore";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [patients,  setPatients]  = useState(null);
  const [templates, setTemplates] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  // Refs so persistPatients/persistTemplates always see the latest state
  const patientsRef  = useRef(null);
  const templatesRef = useRef(null);

  useEffect(() => { patientsRef.current  = patients;  }, [patients]);
  useEffect(() => { templatesRef.current = templates; }, [templates]);

  // ── Load from server on mount ─────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/data")
      .then((r) => r.json())
      .then((data) => {
        setPatients(data.patients);
        setTemplates(data.templates.length > 0 ? data.templates : buildDefaultTemplates());
      })
      .catch((err) => {
        console.error("Failed to load data:", err);
        setError("Could not connect to the local server. Is server.js running?");
        setPatients([]);
        setTemplates(buildDefaultTemplates());
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Persist helpers ───────────────────────────────────────────────────────
  const persistPatients = useCallback(async (nextPatients) => {
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patients: nextPatients }),
      });
      if (!res.ok) console.error("Save patients failed:", await res.text());
    } catch (err) {
      console.error("Failed to save patients:", err);
    }
  }, []);

  const persistTemplates = useCallback(async (nextTemplates) => {
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: nextTemplates }),
      });
      if (!res.ok) console.error("Save templates failed:", await res.text());
    } catch (err) {
      console.error("Failed to save templates:", err);
    }
  }, []);

  // ── Patient mutations ─────────────────────────────────────────────────────
  const addPatient = useCallback((patient) => {
    const next = [...(patientsRef.current || []), patient];
    setPatients(next);
    persistPatients(next);
  }, [persistPatients]);

  const updatePatient = useCallback((updated) => {
    const next = (patientsRef.current || []).map((p) =>
      p.id === updated.id ? { ...p, ...updated } : p
    );
    setPatients(next);
    persistPatients(next);
  }, [persistPatients]);

  // ── Template mutations ────────────────────────────────────────────────────
  const updateTemplate = useCallback((week, message) => {
    const next = (templatesRef.current || []).map((t) =>
      t.week === week ? { ...t, message } : t
    );
    setTemplates(next);
    persistTemplates(next);
  }, [persistTemplates]);

  const isLoaded = patients !== null && templates !== null;

  return (
    <DataContext.Provider value={{
      patients,
      templates,
      loading,
      error,
      isLoaded,
      addPatient,
      updatePatient,
      updateTemplate,
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