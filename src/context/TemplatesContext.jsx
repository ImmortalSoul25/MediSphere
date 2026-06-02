// @refresh reset
// src/context/TemplatesContext.jsx
// Manages message-templates.xlsx data (Pregnancy, Other Conditions, Appointments)

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const TemplatesContext = createContext(null);

export function TemplatesProvider({ children }) {
  const [pregnancy,     setPregnancy]     = useState(null);
  const [other,         setOther]         = useState([]);
  const [appointments,  setAppointments]  = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch("/api/message-templates");
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setPregnancy(data.pregnancy     || []);
      setOther(data.other             || []);
      setAppointments(data.appointments || []);
      setError(null);
    } catch (err) {
      console.error("Failed to load message templates:", err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Save a single pregnancy week update
  const updatePregnancyTemplate = useCallback(async (week, message, ytLink) => {
    setPregnancy((prev) => {
      const next = (prev || []).map((t) =>
        t.week === week ? { ...t, message, ytLink } : t
      );
      // Persist async
      fetch("/api/message-templates/pregnancy", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ pregnancy: next }),
      }).catch(console.error);
      return next;
    });
  }, []);

  return (
    <TemplatesContext.Provider value={{
      pregnancy, other, appointments,
      loading, error,
      refresh,
      updatePregnancyTemplate,
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