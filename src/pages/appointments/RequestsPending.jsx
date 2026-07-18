// src/pages/appointments/RequestsPending.jsx

import { useState, useEffect } from "react";
import { ClockAlert, X, AlertCircle, CheckCircle, XCircle, StickyNote, Eye, UserPlus, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "../../context/AppointmentsContext";
import { useData } from "../../context/DataContext";
import { PatientForm, EMPTY_FORM, generatePatientId, calcAge } from "../Patients";

function fmtDate(str) {
  if (!str || str === "") return "-";
  if (str.includes("/")) return str;
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

function dayName(str) {
  if (!str) return "-";
  const date = new Date(str);
  return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("en-US", { weekday: "long" });
}

function SlotBadge({ slot }) {
  const map = {
    Morning: "bg-amber-50 text-amber-700",
    Afternoon: "bg-sky-50 text-sky-700",
    Evening: "bg-indigo-50 text-indigo-700",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${map[slot] || "bg-slate-100 text-slate-500"}`}>
      {slot || "-"}
    </span>
  );
}

function NotesModal({ request, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Concern</h2>
            <p className="text-xs text-slate-400 mt-0.5">{request.patientName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {request.concern || "No concern submitted."}
          </p>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-slate-100">
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

function ApproveModal({ request, patients, onConfirm, onClose, onAddPatient }) {
  const [date, setDate] = useState(request.requestedDate || "");
  const [time, setTime] = useState("");
  const [period, setPeriod] = useState("AM");
  const [type, setType] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [showDetails, setShowDetails] = useState(false);
  const { fetchPatientDetails } = useData();
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const matchedPatient = patients?.find((p) => {
    if (request.patientId && String(p.id) === String(request.patientId)) return true;
    if (p.contact && request.contact && String(p.contact).replace(/\D/g, '') === String(request.contact).replace(/\D/g, '')) return true;
    return false;
  });
  const isExisting = !!matchedPatient;

  const loadDetails = async () => {
    if (!matchedPatient?.id) return;
    setLoadingDetails(true);
    try {
      const data = await fetchPatientDetails(matchedPatient.id);
      setPatientDetails(data);
    } catch { setPatientDetails(null); }
    finally { setLoadingDetails(false); }
  };

  useEffect(() => {
    if (showDetails && !patientDetails && !loadingDetails) {
      loadDetails();
    }
  }, [showDetails]);

  const validate = () => {
    const e = {};
    if (!date) e.date = "Appointment date is required.";
    if (!time) {
      e.time = "Appointment time is required.";
    } else {
      const [hourStr] = time.split(":");
      const hour = parseInt(hourStr, 10);
      if (hour === 0 || hour > 12) {
        e.time = "Please use 12-hour format (1-12).";
      }
    }
    if (!type) e.type = "Appointment type is required.";
    return e;
  };

  const handleConfirm = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }
    onConfirm(date, `${time} ${period}`, type, notes, matchedPatient?.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md my-auto">
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

        <div className="px-6 py-5 space-y-4 max-h-[72vh] overflow-y-auto">
          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient</span>
              {isExisting ? (
                <button
                  onClick={() => setShowDetails(!showDetails)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition"
                >
                  <Eye size={13} />
                  {showDetails ? "Hide Details" : "View Patient Details"}
                </button>
              ) : (
                <button
                  onClick={() => onAddPatient(request)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-teal-600 hover:text-teal-700 transition"
                >
                  <UserPlus size={13} />
                  Add as New Patient
                </button>
              )}
            </div>
            <div className="px-4 py-2.5">
              {isExisting ? (
                <div className="text-sm text-slate-700">
                  <span className="font-mono text-xs text-slate-500 mr-2">{matchedPatient.id}</span>
                  <span className="font-medium">{matchedPatient.name}</span>
                </div>
              ) : (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                  No patient found with contact {request.contact}. Add them as a new patient to link this appointment.
                </p>
              )}
            </div>
            {showDetails && isExisting && (
              <div className="px-4 pb-3 border-t border-slate-100 pt-3 space-y-1.5">
                {loadingDetails ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
                    <Loader2 size={12} className="animate-spin" /> Loading...
                  </div>
                ) : patientDetails ? (
                  <>
                    {[
                      ["Gender", patientDetails.metadata?.gender],
                      ["Condition", patientDetails.metadata?.conditions?.[0] || "None"],
                      ["Contact", patientDetails.metadata?.contact],
                      ["Age", patientDetails.metadata?.date_of_birth ? calcAge(patientDetails.metadata.date_of_birth) + " yrs" : null],
                      ["Last Visit", patientDetails.metadata?.last_visit ? fmtDate(patientDetails.metadata.last_visit) : "Never"],
                      ["Status", patientDetails.metadata?.is_active ? "Active" : "Inactive"],
                    ].map(([label, val]) => val ? (
                      <div key={label} className="flex justify-between text-xs">
                        <span className="text-slate-500">{label}</span>
                        <span className="font-medium text-slate-700">{val}</span>
                      </div>
                    ) : null)}
                  </>
                ) : (
                  <p className="text-xs text-slate-400">Could not load details.</p>
                )}
              </div>
            )}
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
            The confirmed date and time can differ from what the patient requested.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Appointment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrors((p) => ({ ...p, date: "" }));
              }}
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Appointment Time <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="time"
                value={time}
                onChange={(e) => {
                  setTime(e.target.value);
                  setErrors((p) => ({ ...p, time: "" }));
                }}
                className={`flex-1 px-3 py-2.5 text-sm border rounded-xl transition
                  focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent
                  ${errors.time ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
              />
              <div className="flex rounded-xl border border-slate-200 overflow-hidden">
                {["AM", "PM"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriod(p)}
                    className={`px-4 py-2.5 text-sm font-semibold transition
                      ${period === p ? "bg-teal-600 text-white" : "bg-white text-slate-500 hover:bg-slate-50"}`}
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

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Appointment Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setErrors((p) => ({ ...p, type: "" }));
              }}
              className={`w-full px-3 py-2.5 text-sm border rounded-xl transition
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent
                ${errors.type ? "border-rose-300 bg-rose-50" : "border-slate-200 bg-white text-slate-700"}`}
            >
              <option value="" disabled>Select Type</option>
              <option value="First Consultation">First Consultation</option>
              <option value="Follow Up">Follow Up</option>
              <option value="ANC">ANC</option>
              <option value="bloodtest">bloodtest</option>
              <option value="Vaccine">Vaccine</option>
              <option value="2nd Opinion">2nd Opinion</option>
              <option value="Sonography">Sonography</option>
              <option value="Surgery">Surgery</option>
              <option value="Meeting">Meeting</option>
              <option value="Other">Other</option>
            </select>
            {errors.type && (
              <p className="mt-1 text-xs text-rose-500 flex items-center gap-1">
                <AlertCircle size={11} />{errors.type}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Appointment Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-white text-slate-700
                focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
            />
          </div>
        </div>

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

function RejectConfirm({ request, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="px-6 py-5 text-center">
          <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-4">
            <XCircle size={24} className="text-rose-500" />
          </div>
          <h2 className="text-base font-bold text-slate-800 mb-1">Reject Request?</h2>
          <p className="text-sm text-slate-500">
            Are you sure you want to reject the appointment request from{" "}
            <span className="font-semibold text-slate-700">{request.patientName}</span>?
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
            Yes, Reject
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RequestsPending() {
  const { requests, approveRequest, declineRequest, loading } = useAppointments();
  const { patients, addPatient } = useData();
  const [modal, setModal] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const navigate = useNavigate();

  const sortedRequests = [...(requests || [])].sort((a, b) => {
    if (sortOrder === "newest") return new Date(b.requestedOn || 0) - new Date(a.requestedOn || 0);
    if (sortOrder === "oldest") return new Date(a.requestedOn || 0) - new Date(b.requestedOn || 0);
    if (sortOrder === "date_asc") return new Date(a.requestedDate || 0) - new Date(b.requestedDate || 0);
    if (sortOrder === "date_desc") return new Date(b.requestedDate || 0) - new Date(a.requestedDate || 0);
    return 0;
  });

  const localISO = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
  const today = new Date();
  const todayStr = localISO(today);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = localISO(tomorrow);

  const todayStrSlash = `${today.getDate().toString().padStart(2, "0")}/${(today.getMonth() + 1).toString().padStart(2, "0")}/${today.getFullYear()}`;
  const tomorrowStrSlash = `${tomorrow.getDate().toString().padStart(2, "0")}/${(tomorrow.getMonth() + 1).toString().padStart(2, "0")}/${tomorrow.getFullYear()}`;

  const todayCount = requests.filter(r => r.requestedDate === todayStr || r.requestedDate === todayStrSlash).length;
  const tomorrowCount = requests.filter(r => r.requestedDate === tomorrowStr || r.requestedDate === tomorrowStrSlash).length;

  const handleApprove = async (date, time, type, notes, patientId) => {
    await approveRequest(modal.request.id, date, time, type, notes, patientId);
    setModal(null);
  };

  const handleReject = async () => {
    await declineRequest(modal.request.id);
    setModal(null);
  };

  const handleAddNewPatient = (request) => {
    setShowAddPatient({
      ...EMPTY_FORM,
      name: request.patientName || "",
      number: request.contact || "",
    });
  };

  const handleSaveNewPatient = async (data) => {
    await addPatient(data);
    setShowAddPatient(null);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Requests Pending</h1>
          <p className="mt-1 text-slate-500">
            Review and respond to incoming appointment requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/appointments/requests/rejected")}
            className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 font-medium transition"
          >
            Rejected Requests
          </button>
          <button
            onClick={() => navigate("/appointments/requests/expired")}
            className="px-4 py-2 bg-white border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50 font-medium transition"
          >
            Expired Requests
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Total Pending</p>
            <p className="text-2xl font-bold text-slate-800">{requests.length}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <ClockAlert size={20} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Today's Requests</p>
            <p className="text-2xl font-bold text-slate-800">{todayCount}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
            <ClockAlert size={20} />
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Tomorrow's Requests</p>
            <p className="text-2xl font-bold text-slate-800">{tomorrowCount}</p>
          </div>
          <div className="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ClockAlert size={20} />
          </div>
        </div>
      </div>

      <div className="flex justify-end mb-4">
        <div className="flex items-center gap-2">
          <label htmlFor="sortRequests" className="text-sm font-medium text-slate-600">Sort by:</label>
          <select 
            id="sortRequests"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="newest">Newest Received</option>
            <option value="oldest">Oldest Received</option>
            <option value="date_asc">Requested Date (Soonest)</option>
            <option value="date_desc">Requested Date (Furthest)</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3 font-semibold">Patient ID</th>
                <th className="px-5 py-3 font-semibold">Patient Name</th>
                <th className="px-5 py-3 font-semibold">Contact</th>
                <th className="px-5 py-3 font-semibold">Age</th>
                <th className="px-5 py-3 font-semibold">Requested Date</th>
                <th className="px-5 py-3 font-semibold">Day</th>
                <th className="px-5 py-3 font-semibold">Requested Slot</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                    Loading requests...
                  </td>
                </tr>
              ) : sortedRequests.length > 0 ? (
                sortedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors duration-100">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{req.patientId || "-"}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{req.patientName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.contact}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.age || "-"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtDate(req.requestedDate)}</td>
                    <td className="px-5 py-3.5 text-slate-600">{dayName(req.requestedDate)}</td>
                    <td className="px-5 py-3.5"><SlotBadge slot={req.requestedSlot} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <button title="Approve" onClick={() => setModal({ type: "approve", request: req })} className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition">
                          <CheckCircle size={18} />
                        </button>
                        <button
                          onClick={() => setModal({ type: "concern", request: req })}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition"
                        >
                          View Concern
                        </button>
                        <button title="Reject" onClick={() => setModal({ type: "reject", request: req })} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition">
                          <XCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
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

      {modal?.type === "approve" && (
        <ApproveModal
          request={modal.request}
          patients={patients}
          onConfirm={handleApprove}
          onClose={() => setModal(null)}
          onAddPatient={handleAddNewPatient}
        />
      )}
      {modal?.type === "concern" && (
        <NotesModal
          request={modal.request}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === "reject" && (
        <RejectConfirm
          request={modal.request}
          onConfirm={handleReject}
          onClose={() => setModal(null)}
        />
      )}
      {showAddPatient && (
        <PatientForm
          title="Add New Patient"
          initial={showAddPatient}
          isEdit={false}
          patients={patients || []}
          onSave={handleSaveNewPatient}
          onClose={() => setShowAddPatient(null)}
        />
      )}
    </div>
  );
}


