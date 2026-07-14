import { Loader2, CalendarDays, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTemplates } from "../../context/TemplatesContext";

export default function AppointmentTemplates() {
  const { appointments, loading, error } = useTemplates();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-10">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading appointment templates…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-4 text-sm text-rose-700">
        <p className="font-semibold mb-1">Failed to load templates</p>
        <p className="font-mono text-xs">{error}</p>
        <p className="text-xs mt-1 text-rose-600">
          Make sure <code>uvicorn main:app --reload --port 8000</code> is running.
        </p>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case "APPROVED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-800">APPROVED</span>;
      case "PENDING":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">PENDING</span>;
      case "REJECTED":
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">REJECTED</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-800">{status}</span>;
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return new Date(dateStr).toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-800">
            <CalendarDays size={18} className="text-teal-600" />
            <h2 className="font-semibold">Appointment Message Templates</h2>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">ID</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(appointments || []).map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-sm text-slate-700 font-medium">{t.id}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-700">{t.name}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                      {t.type}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm">
                    {getStatusBadge(t.approval_status)}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-500">{formatDate(t.last_updated)}</td>
                  <td className="px-5 py-3.5 text-sm text-right">
                    <button
                      onClick={() => navigate(`/templates/appointments/${t.id}`)}
                      className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-800 font-medium transition-colors"
                    >
                      View Template
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
