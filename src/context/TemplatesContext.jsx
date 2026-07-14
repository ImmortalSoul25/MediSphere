// @refresh reset
// src/context/TemplatesContext.jsx
// Pregnancy message templates now come from FastAPI (/templates/pregnancy)
// Data is persisted in templates_data.json on the server

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const TemplatesContext = createContext(null);

export function TemplatesProvider({ children }) {
  const [pregnancy,    setPregnancy]    = useState(null);  // array of 40 templates
  const [appointments, setAppointments] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);

  // ── Load all templates from FastAPI ────────────────────────────────
  const refresh = useCallback(async () => {
    try {
      const [pregRes, apptRes] = await Promise.all([
        fetch("/templates/pregnancy"),
        fetch("/templates/appointments")
      ]);
      
      if (!pregRes.ok) throw new Error(`GET /templates/pregnancy → ${pregRes.status}`);
      if (!apptRes.ok) throw new Error(`GET /templates/appointments → ${apptRes.status}`);
      
      const pregData = await pregRes.json();
      const apptData = await apptRes.json();
      
      setPregnancy(pregData);
      setAppointments(Object.values(apptData)); // Convert dict to array
      setError(null);
    } catch (err) {
      console.error("Failed to load templates:", err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // ── Update a single week via PATCH /templates/pregnancy/{week} ──────────────
  const updatePregnancyTemplate = useCallback(async (week, dataObj) => {
    setPregnancy((prev) =>
      (prev || []).map((t) => String(t.week) === String(week) ? { ...t, ...dataObj } : t)
    );

    const res = await fetch(`/templates/pregnancy/${week}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(dataObj),
    });

    if (!res.ok) {
      await refresh();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to save week ${week}`);
    }

    const data = await res.json();
    setPregnancy((prev) =>
      (prev || []).map((t) => String(t.week) === String(week) ? data.template : t)
    );
  }, [refresh]);

  // ── Update a single appointment template via PATCH /templates/appointments/{id} ──────────────
  const updateAppointmentTemplate = useCallback(async (id, dataObj) => {
    setAppointments((prev) =>
      (prev || []).map((t) => String(t.id) === String(id) ? { ...t, ...dataObj } : t)
    );

    const res = await fetch(`/templates/appointments/${id}`, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(dataObj),
    });

    if (!res.ok) {
      await refresh();
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to save template ${id}`);
    }

    // backend returns the updated template dictionary, or something.
    // wait, what does update_appointment_template return? we will check.
    const updated = await res.json();
    setAppointments((prev) =>
      (prev || []).map((t) => String(t.id) === String(id) ? updated : t)
    );
  }, [refresh]);

  return (
    <TemplatesContext.Provider value={{
      pregnancy,
      appointments,
      loading,
      error,
      refresh,
      updatePregnancyTemplate,
      updateAppointmentTemplate,
    }}>
      {children}
    </TemplatesContext.Provider>
  );
}

export function useTemplates() {
  const ctx = useContext(TemplatesContext);
  if (!ctx) throw new Error("useTemplates must be used inside <TemplatesProvider>");
  return ctx;
}