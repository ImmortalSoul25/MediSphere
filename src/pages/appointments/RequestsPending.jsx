// src/pages/appointments/RequestsPending.jsx

import { useState } from "react";
import { ClockAlert, X, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { useAppointments } from "../../context/AppointmentsContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str || str === "") return "—";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

const SLOTS = ["Morning", "Afternoon", "Evening"];

function SlotBadge({ slot }) {
  const map = {
    Morning:   "bg-amber-50  text-amber-700",
    Afternoon: "bg-sky-50    text-sky-700",
    Evening:   "bg-indigo-50 text-indigo-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[slot] || "bg-slate-100 text-slate-500"}`}>
      {slot || "—"}
    </span>
  );
}

// ─── Approve Modal ────────────────────────────────────────────────────────────
function ApproveModal({ request, onConfirm, onClose }) {
  const [date,   setDate]   = useState("");
  const [time,   setTime]   = useState("");
  const [period, setPeriod] = useState("AM");
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!date) e.date = "Appointment date is required.";
    if (!time) e.time = "Appointment time is required.";
    return e;
  };

  const handleConfirm = () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    // Combine time + period into a readable string e.g. "10:30 AM"
    onConfirm(date, `${time} ${period}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Approve Appointment</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              For <span className="font-semibold text-slate-600">{request.patientName}</span>
              {request.requestedDate && ` · Requested ${fmtDate(request.requestedDate)}`}
              {request.requestedSlot && ` (${request.requestedSlot})`}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            The confirmed date and time can differ from what the patient requested.
          </p>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Appointment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setErrors((p) => ({ ...p, date: "" })); }}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent
                ${errors.date ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
            />
            {errors.date && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle size={11} />{errors.date}
              </p>
            )}
          </div>

          {/* Time */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Appointment Time <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => { setTime(e.target.value); setErrors((p) => ({ ...p, time: "" })); }}
                className={`flex-1 px-3 py-2.5 text-sm border rounded-xl transition
                  focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent
                  ${errors.time ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
              />
              {/* AM / PM toggle */}
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                {["AM", "PM"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2.5 text-sm font-semibold transition
                      ${period === p
                        ? "bg-teal-600 text-white"
                        : "bg-white text-slate-500 hover:bg-slate-50"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            {errors.time && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle size={11} />{errors.time}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-100">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white
                       bg-teal-600 hover:bg-teal-700 rounded-xl shadow-sm transition">
            <CheckCircle size={15} />
            Confirm Appointment
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Decline Confirm ──────────────────────────────────────────────────────────
function DeclineConfirm({ request, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 text-center">
          <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
            <XCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Decline Request?</h2>
          <p className="text-sm text-slate-500">
            Are you sure you want to decline the appointment request from{" "}
            <span className="font-semibold text-slate-700">{request.patientName}</span>?
            This action cannot be undone.
          </p>
        </div>
        <div className="flex gap-3 px-6 pb-5">
          <button onClick={onClose}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-600
                       border border-slate-200 rounded-xl hover:bg-slate-50 transition">
            Cancel
          </button>
          <button onClick={onConfirm}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-white
                       bg-rose-500 hover:bg-rose-600 rounded-xl shadow-sm transition">
            Yes, Decline
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function RequestsPending() {
  const { requests, approveRequest, declineRequest, loading } = useAppointments();

  // modal: null | { type: "approve"|"decline", request }
  const [modal, setModal] = useState(null);

  const handleApprove = async (date, time) => {
    await approveRequest(modal.request.id, date, time);
    setModal(null);
  };

  const handleDecline = async () => {
    await declineRequest(modal.request.id);
    setModal(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Requests Pending</h1>
        <p className="mt-1 text-slate-500">
          Review and respond to incoming appointment requests.
        </p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-semibold">Patient Name</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Age</th>
                <th className="px-5 py-3 font-semibold">Requested Date</th>
                <th className="px-5 py-3 font-semibold">Requested Slot</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Loading requests…
                  </td>
                </tr>
              ) : requests.length > 0 ? (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-5 py-3.5 font-medium text-slate-800">{req.patientName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.contact}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.age || "—"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(req.requestedDate)}</td>
                    <td className="px-5 py-3.5"><SlotBadge slot={req.requestedSlot} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setModal({ type: "approve", request: req })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                     bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-lg transition"
                        >
                          <CheckCircle size={13} />
                          Approve
                        </button>
                        <button
                          onClick={() => setModal({ type: "decline", request: req })}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold
                                     bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                        >
                          <XCircle size={13} />
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="bg-slate-100 p-4 rounded-full">
                        <ClockAlert size={28} className="text-slate-400" />
                      </div>
                      <p className="text-slate-400 text-sm">No pending requests at the moment.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          {requests.length} pending {requests.length === 1 ? "request" : "requests"}
        </div>
      </div>

      {/* Modals */}
      {modal?.type === "approve" && (
        <ApproveModal
          request={modal.request}
          onConfirm={handleApprove}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "decline" && (
        <DeclineConfirm
          request={modal.request}
          onConfirm={handleDecline}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}