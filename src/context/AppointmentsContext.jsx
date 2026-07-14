// @refresh reset
// src/context/AppointmentsContext.jsx

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AppointmentsContext = createContext(null);

function ddmmyyyyToIso(value) {
  if (!value || !value.includes("/")) return value || "";
  const [d, m, y] = value.split("/");
  return `${y}-${m}-${d}`;
}

function mapRequest(req) {
  return {
    id: req.requestId || req.request_id || req.id,
    patientId: req.patientId || req.patient_id || "",
    patientName: req.patientName || req.patient_name,
    contact: req.contact || req.contact_number,
    age: req.age,
    requestedDate: ddmmyyyyToIso(req.preferredDate || req.preferred_date),
    requestedDateDisplay: req.preferredDate || req.preferred_date,
    requestedSlot: req.preferredTime || req.preferred_slot,
    requestedOn: req.createdAt || req.created_at,
    concern: req.concern,
    status: req.status,
  };
}

async function fetchJson(url, options = {}) {
  const finalOptions = {
    ...options,
    headers: {
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
      ...(options.headers || {})
    }
  };
  const res = await fetch(url, finalOptions);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload.detail || payload.error || `${url} failed (${res.status})`);
  }
  return res.json();
}

function isExpired(dateIso) {
  if (!dateIso) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reqDate = new Date(dateIso);
  reqDate.setHours(0, 0, 0, 0);
  return reqDate.getTime() < today.getTime();
}

async function fetchAppointments() {
  const [allRequestsRaw, scheduled, past] = await Promise.all([
    fetchJson("/requests"),
    fetchJson("/scheduled-appointments"),
    fetchJson("/past-appointments"),
  ]);

  const allRequests = (allRequestsRaw || []).map(mapRequest);
  
  const pendingRequests = [];
  const rejectedRequests = [];
  const expiredRequests = [];

  allRequests.forEach(req => {
    if (req.status === "Declined") {
      rejectedRequests.push(req);
    } else if (req.status === "Pending") {
      if (isExpired(req.requestedDate)) {
        expiredRequests.push(req);
      } else {
        pendingRequests.push(req);
      }
    }
  });

  return {
    requests: pendingRequests,
    rejectedRequests,
    expiredRequests,
    scheduled: scheduled || [],
    past: past || [],
  };
}

export function AppointmentsProvider({ children }) {
  const [requests, setRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);
  const [expiredRequests, setExpiredRequests] = useState([]);
  const [scheduled, setScheduled] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchAppointments();
      setRequests(data.requests);
      setRejectedRequests(data.rejectedRequests);
      setExpiredRequests(data.expiredRequests);
      setScheduled(data.scheduled);
      setPast(data.past);
      setError(null);
    } catch (err) {
      console.error("Failed to refresh appointments:", err);
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    
    const interval = setInterval(() => {
      refresh();
    }, 10000); // Poll every 10 seconds
    
    return () => clearInterval(interval);
  }, [refresh]);

  const approveRequest = useCallback(async (requestId, appointmentDate, appointmentTime, appointmentType, appointmentNotes, patientId) => {
    try {
      await fetchJson(`/requests/${requestId}/approve`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentDate,
          appointmentTime,
          appointmentType,
          notes: appointmentNotes,
          patientId,
        }),
      });
      await refresh();
      return null;
    } catch (err) {
      console.error("approveRequest:", err);
      return err.message;
    }
  }, [refresh]);

  const declineRequest = useCallback(async (requestId) => {
    try {
      await fetchJson(`/requests/${requestId}/reject`, { method: "PATCH" });
      await refresh();
      return null;
    } catch (err) {
      console.error("declineRequest:", err);
      return err.message;
    }
  }, [refresh]);

  const deleteRequest = useCallback(async (requestId) => {
    try {
      await fetchJson(`/requests/${requestId}`, { method: "DELETE" });
      await refresh();
      return null;
    } catch (err) {
      console.error("deleteRequest:", err);
      return err.message;
    }
  }, [refresh]);

  const rescheduleAppointment = useCallback(async (appointmentId, appointmentDate, appointmentTime) => {
    try {
      await fetchJson(`/scheduled-appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentDate, appointmentTime }),
      });
      await refresh();
      return null;
    } catch (err) {
      console.error("rescheduleAppointment:", err);
      return err.message;
    }
  }, [refresh]);

  const cancelAppointment = useCallback(async (appointmentId) => {
    try {
      await fetchJson(`/scheduled-appointments/${appointmentId}`, { method: "DELETE" });
      await refresh();
      return null;
    } catch (err) {
      console.error("cancelAppointment:", err);
      return err.message;
    }
  }, [refresh]);

  const deletePastAppointment = useCallback(async (appointmentId) => {
    try {
      await fetchJson(`/past-appointments/${appointmentId}`, { method: "DELETE" });
      await refresh();
      return null;
    } catch (err) {
      console.error("deletePastAppointment:", err);
      return err.message;
    }
  }, [refresh]);

  const addDirectAppointment = useCallback(async (appointment) => {
    try {
      await fetchJson("/scheduled-appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      });
      await refresh();
      return null;
    } catch (err) {
      console.error("addDirectAppointment:", err);
      return err.message;
    }
  }, [refresh]);

  const fetchPatientAppointments = useCallback(async (patientId) => {
    return fetchJson(`/appointments/patient/${patientId}`);
  }, []);

  return (
    <AppointmentsContext.Provider value={{
      requests, rejectedRequests, expiredRequests, scheduled, past, loading, error,
      refresh,
      approveRequest,
      declineRequest,
      deleteRequest,
      rescheduleAppointment,
      cancelAppointment,
      deletePastAppointment,
      addDirectAppointment,
      fetchPatientAppointments,
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
