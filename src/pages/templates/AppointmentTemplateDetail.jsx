import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit2, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useTemplates } from "../../context/TemplatesContext";

export default function AppointmentTemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { appointments, loading, error, updateAppointmentTemplate } = useTemplates();

  const [template, setTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    if (appointments) {
      const found = appointments.find((t) => String(t.id) === String(id));
      if (found) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setTemplate(found);
      }
    }
  }, [appointments, id]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-slate-400 py-10 px-6">
        <Loader2 size={18} className="animate-spin" />
        <span className="text-sm">Loading template details…</span>
      </div>
    );
  }

  if (error || (!loading && !template)) {
    return (
      <div className="p-6">
        <button onClick={() => navigate("/message-templates", { state: { tab: "appointments" } })} className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowLeft size={16} /> Back to Templates
        </button>
        <div className="bg-rose-50 border border-rose-200 rounded-xl px-5 py-4 text-sm text-rose-700">
          <p className="font-semibold mb-1">Failed to load template details</p>
          <p>{error || "Template not found."}</p>
        </div>
      </div>
    );
  }

  const handleEdit = () => {
    setDraft({ ...template });
    setIsEditing(true);
    setFeedback({ type: "", message: "" });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setDraft({});
    setFeedback({ type: "", message: "" });
  };

  const handleSendForApproval = async () => {
    setSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      const updatedData = {
        ...draft,
        approval_status: "APPROVED",
        last_updated: new Date().toISOString()
      };
      // template.template_name is the actual key in backend, but we indexed them by id
      // we'll update via the same ID endpoint as updated in backend
      await updateAppointmentTemplate(template.id, updatedData);
      setTemplate(updatedData);
      setIsEditing(false);
      setFeedback({ type: "success", message: "Template submitted for approval successfully." });
    } catch (err) { // eslint-disable-line no-unused-vars
      setFeedback({ type: "error", message: "Failed to submit template for approval." });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

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

  const displayData = isEditing ? draft : template;

  return (
    <div className="max-w-3xl px-6 py-6">
      <button 
        onClick={() => navigate("/message-templates", { state: { tab: "appointments" } })} 
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Back to Templates
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Appointment Template Details</h2>
            <p className="text-sm text-slate-500 mt-1">ID {template.id}</p>
          </div>
          {!isEditing && (
            <button 
              onClick={handleEdit}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors"
            >
              <Edit2 size={14} /> Edit Template
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {feedback.message && (
            <div className={`flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-rose-50 border border-rose-200 text-rose-700'}`}>
              {feedback.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
              <span>{feedback.message}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Template ID</label>
              <div className="text-sm font-medium text-slate-800">{template.id}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Last Updated</label>
              <div className="text-sm text-slate-800">{formatDate(template.last_updated)}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Approval Status</label>
              <div>{getStatusBadge(displayData.approval_status)}</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Template Type</label>
              {isEditing ? (
                <select 
                  value={draft.type}
                  onChange={(e) => handleChange("type", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                >
                  <option value="UTILITY">UTILITY</option>
                  <option value="MARKETING">MARKETING</option>
                  <option value="AUTHENTICATION">AUTHENTICATION</option>
                </select>
              ) : (
                <div className="text-sm font-medium text-slate-800">{template.type}</div>
              )}
            </div>
            
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Template Name</label>
              {isEditing ? (
                <input 
                  type="text"
                  value={draft.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
                />
              ) : (
                <div className="text-sm font-medium text-slate-800">{template.name}</div>
              )}
            </div>

          </div>

          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Message Content</label>
            {isEditing ? (
              <textarea
                value={draft.message}
                onChange={(e) => handleChange("message", e.target.value)}
                rows={8}
                className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl bg-slate-50 text-slate-700 leading-relaxed resize-y focus:outline-none focus:ring-2 focus:ring-teal-400 focus:bg-white transition"
              />
            ) : (
              <div className="w-full px-4 py-4 text-sm border border-slate-100 rounded-xl bg-slate-50 text-slate-700 leading-relaxed whitespace-pre-wrap">
                {template.message}
              </div>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
            <button 
              onClick={handleCancel}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleSendForApproval}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Send For Approval
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
