import { useState } from "react";
import { X, ClockAlert, CheckCircle, XCircle, Trash2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppointments } from "../../context/AppointmentsContext";

function fmtDateLocal(str) {
  if (!str || str === "") return "-";
  if (str.includes("/")) return str;
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

export default function RequestsRejected() {
  const { rejectedRequests, deleteRequest, loading } = useAppointments();
  const [modal, setModal] = useState(null);
  const [sortOrder, setSortOrder] = useState("newest");
  const navigate = useNavigate();

  const sortedRequests = [...(rejectedRequests || [])].sort((a, b) => {
    if (sortOrder === "newest") return new Date(b.requestedOn || 0) - new Date(a.requestedOn || 0);
    if (sortOrder === "oldest") return new Date(a.requestedOn || 0) - new Date(b.requestedOn || 0);
    if (sortOrder === "date_asc") return new Date(a.requestedDate || 0) - new Date(b.requestedDate || 0);
    if (sortOrder === "date_desc") return new Date(b.requestedDate || 0) - new Date(a.requestedDate || 0);
    return 0;
  });

  const handleDelete = async () => {
    await deleteRequest(modal.request.id);
    setModal(null);
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
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Rejected Requests</h1>
          <p className="mt-1 text-slate-500">
            View and manage declined appointment requests.
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
                  <tr key={req.id} className="hover:bg-slate-50 transition-colors duration-100 opacity-70">
                    <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{req.patientId || "-"}</td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{req.patientName}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.contact}</td>
                    <td className="px-5 py-3.5 text-slate-600">{req.age || "-"}</td>
                    <td className="px-5 py-3.5 text-slate-600">{fmtDateLocal(req.requestedDate)}</td>
                    <td className="px-5 py-3.5"><SlotBadge slot={req.requestedSlot} /></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
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
                      <p>No rejected requests found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

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
                Are you sure you want to permanently delete this request for <span className="font-semibold text-slate-700">{modal.request.patientName}</span>?
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
    </div>
  );
}
