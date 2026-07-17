import { useState, useEffect } from "react";
import { ClockAlert, X, AlertCircle, CheckCircle, Trash2, Eye, UserPlus, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "../../context/AppointmentsContext";
import { useData } from "../../context/DataContext";
import { PatientForm, EMPTY_FORM, generatePatientId, calcAge } from "../Patients";

function fmtDateLocal(str) {
  if (!str || str === "") return "-";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

function SlotBadge({ slot }) {
  if (!slot) return <span className="text-slate-300 text-xs">—</span>;
  if (slot.toLowerCase().includes("morning")) return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-medium">Morning</span>;
  if (slot.toLowerCase().includes("afternoon")) return <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded text-xs font-medium">Afternoon</span>;
  if (slot.toLowerCase().includes("evening")) return <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-medium">Evening</span>;
  return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-medium">{slot}</span>;
}

function ViewConcernModal({ request, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Patient Concern</h2>
            <p className="text-xs text-slate-400 mt-0.5">{request.patientName}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
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

function ApproveModalExpired({ request, patients, onConfirm, onClose, onAddPatient }) {
  // Do NOT autofill date for expired requests
  const [date, setDate] = useState("");
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
            <h2 className="text-base font-bold text-slate-800">Approve Expired Request</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              For <span className="font-semibold text-slate-600">{request.patientName}</span>
              {request.requestedDate && ` · Missed ${fmtDateLocal(request.requestedDate)}`}
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
                      ["Last Visit", patientDetails.metadata?.last_visit ? fmtDateLocal(patientDetails.metadata.last_visit) : "Never"],
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

          <p className="text-xs text-amber-600 bg-amber-50 rounded-xl px-4 py-3 border border-amber-200">
            Please pick a new future date as the requested date has already passed.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              New Appointment Date <span className="text-rose-500">*</span>
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
              <option value="Routine Check">Routine Check</option>
              <option value="Vaccination">Vaccination</option>
              <option value="Sonography">Sonography</option>
              <option value="Surgery">Surgery</option>
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

export default function RequestsExpired() {
  const { expiredRequests, approveRequest, deleteRequest, loading } = useAppointments();
  const { patients, addPatient } = useData();
  const [modal, setModal] = useState(null);
  const [showAddPatient, setShowAddPatient] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const navigate = useNavigate();

  const sortedRequests = [...(expiredRequests || [])].sort((a, b) => {
    if (sortOrder === "newest") return new Date(b.requestedOn || 0) - new Date(a.requestedOn || 0);
    if (sortOrder === "oldest") return new Date(a.requestedOn || 0) - new Date(b.requestedOn || 0);
    if (sortOrder === "date_asc") return new Date(a.requestedDate || 0) - new Date(b.requestedDate || 0);
    if (sortOrder === "date_desc") return new Date(b.requestedDate || 0) - new Date(a.requestedDate || 0);
    return 0;
  });

  const handleApprove = async (date, time, type, notes, patientId) => {
    await approveRequest(modal.request.id, date, time, type, notes, patientId);
    setModal(null);
  };

  const handleDelete = async () => {
    await deleteRequest(modal.request.id);
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
      <div className="mb-4">
        <button 
          onClick={() => navigate("/appointments/requests")}
          className="flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          <ArrowLeft size={16} className="mr-1" /> Back to Pending
        </button>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Expired Requests</h1>
          <p className="mt-1 text-slate-500">
            Requests that have passed their requested date.
          </p>
        </div>
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
                <th className="px-5 py-3 font-semibold">Requested Slot</th>
                <th className="px-5 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
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
                    <td className="px-5 py-3.5 text-slate-600">{fmtDateLocal(req.requestedDate)}</td>
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
                        <button
                          title="Delete"
                          onClick={() => setModal({ type: "delete", request: req })}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-slate-400 text-sm">
                    <div className="flex flex-col items-center gap-2">
                      <ClockAlert size={24} className="text-slate-300" />
                      <p>No expired requests found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal?.type === "approve" && (
        <ApproveModalExpired
          request={modal.request}
          patients={patients}
          onConfirm={handleApprove}
          onClose={() => setModal(null)}
          onAddPatient={handleAddNewPatient}
        />
      )}

      {modal?.type === "concern" && (
        <ViewConcernModal
          request={modal.request}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === "delete" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-5 text-center">
              <h2 className="text-base font-bold text-slate-800 mb-1">Delete Request?</h2>
              <p className="text-sm text-slate-500">
                Are you sure you want to permanently delete this expired request for <span className="font-semibold text-slate-700">{modal.request.patientName}</span>?
              </p>
            </div>
            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setModal(null)} className="flex-1 px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition">
                Cancel
              </button>
              <button onClick={handleDelete} className="flex-1 px-4 py-2 text-sm font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-xl shadow-sm transition">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddPatient && (
        <PatientForm
          initialData={showAddPatient}
          onClose={() => setShowAddPatient(null)}
          onSave={handleSaveNewPatient}
        />
      )}
    </div>
  );
}
