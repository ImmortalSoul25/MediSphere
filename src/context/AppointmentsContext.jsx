// @refresh reset
// src/context/AppointmentsContext.jsx

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AppointmentsContext = createContext(null);

async function fetchAppointments() {
  const res = await fetch("/api/appointments");
  if (!res.ok) throw new Error(`Server error: ${res.status}`);
  return res.json();
}

export function AppointmentsProvider({ children }) {
  const [requests,  setRequests]  = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [past,      setPast]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAppointments();
      setRequests(data.requests   || []);
      setScheduled(data.scheduled || []);
      setPast(data.past           || []);
    } catch (err) {
      console.error("Failed to refresh appointments:", err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // ── Generic mutation helper ────────────────────────────────────────────────
  // Posts to a server endpoint, then re-fetches fresh state.
  // Returns null on success, or an error message string on failure.
  //
  // WHY THE RETURN VALUE MATTERS:
  // The component's run() function checks: if (err) showError; else closeModal.
  // If we swallow errors here and always return undefined, run() always sees
  // "no error" and closes the modal even when the server call actually failed.
  // Returning null (success) vs string (error) lets run() behave correctly.
  const mutate = useCallback(async (url, body) => {
    const res = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(body),
    });
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(payload.error || `Request to ${url} failed (${res.status})`);
    }
    // Re-fetch so UI always reflects the true state on disk
    await refresh();
    return null; // explicit success signal
  }, [refresh]);

  // ── Public API ─────────────────────────────────────────────────────────────
  // Every function returns:
  //   null          → operation succeeded, table will update from refresh()
  //   "error text"  → operation failed, caller should display this to the user
  //
  // This contract is what lets the run() helper in page components correctly
  // decide whether to close the modal or show an error banner.

  const approveRequest = useCallback(async (requestId, appointmentDate, appointmentTime) => {
    try {
      return await mutate("/api/appointments/approve", { requestId, appointmentDate, appointmentTime });
    } catch (err) {
      console.error("approveRequest:", err);
      return err.message;
    }
  }, [mutate]);

  const declineRequest = useCallback(async (requestId) => {
    try {
      return await mutate("/api/appointments/decline", { requestId });
    } catch (err) {
      console.error("declineRequest:", err);
      return err.message;
    }
  }, [mutate]);

  const rescheduleAppointment = useCallback(async (appointmentId, appointmentDate, appointmentTime) => {
    try {
      return await mutate("/api/appointments/reschedule", { appointmentId, appointmentDate, appointmentTime });
    } catch (err) {
      console.error("rescheduleAppointment:", err);
      return err.message;
    }
  }, [mutate]);

  // FIX: was calling /api/appointments/cancel which didn't exist in server.js
  // Server now has this endpoint. Returns null on success, error string on failure.
  const cancelAppointment = useCallback(async (appointmentId) => {
    try {
      return await mutate("/api/appointments/cancel", { appointmentId });
    } catch (err) {
      console.error("cancelAppointment:", err);
      return err.message;
    }
  }, [mutate]);

  // FIX: was calling /api/appointments/add which didn't exist in server.js
  // Server now has this endpoint. Returns null on success, error string on failure.
  const addDirectAppointment = useCallback(async (appointment) => {
    try {
      return await mutate("/api/appointments/add", { appointment });
    } catch (err) {
      console.error("addDirectAppointment:", err);
      return err.message;
    }
  }, [mutate]);

  return (
    <AppointmentsContext.Provider value={{
      requests, scheduled, past, loading, error,
      refresh,
      approveRequest,
      declineRequest,
      rescheduleAppointment,
      cancelAppointment,
      addDirectAppointment,
    }}>
      {children}
    </AppointmentsContext.Provider>
  );
}

export function useAppointments() {
  const ctx = useContext(AppointmentsContext);
  if (!ctx) throw new Error("useAppointments must be used inside <AppointmentsProvider>");
  return ctx;
}