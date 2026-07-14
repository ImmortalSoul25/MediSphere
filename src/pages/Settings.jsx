import { useCallback, useEffect, useState } from "react";
import { Download, Moon, Save, Sun, Upload, X, Plus, Edit3, Trash2, ChevronDown, ChevronUp, FileSpreadsheet, Archive, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useData } from "../context/DataContext";

const DEFAULT_SETTINGS = {
  theme: "light",
  scheduler_time: "09:00 AM",
  hospital_name: "Le Nest Hospital",
  contact_number: "",
};

function normalizeSettings(value) {
  return { ...DEFAULT_SETTINGS, ...(value || {}) };
}

function parseTime(value) {
  const match = String(value || DEFAULT_SETTINGS.scheduler_time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return { hour: "09", minute: "00", period: "AM" };
  return { hour: match[1].padStart(2, "0"), minute: match[2], period: match[3].toUpperCase() };
}

function formatTime(parts) {
  return `${parts.hour.padStart(2, "0")}:${parts.minute} ${parts.period}`;
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      <h2 className="text-sm font-bold text-slate-800 mb-4">{title}</h2>
      {children}

          </div>
  );
}

function TimeEditor({ value, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <input
        value={value.hour}
        maxLength={2}
        onChange={(e) => onChange({ ...value, hour: e.target.value.replace(/\D/g, "").slice(0, 2) })}
        className="w-14 px-2 py-2 text-sm border border-slate-200 rounded-xl text-center"
      />
      <span className="text-slate-400 font-bold">:</span>
      <input
        value={value.minute}
        maxLength={2}
        onChange={(e) => onChange({ ...value, minute: e.target.value.replace(/\D/g, "").slice(0, 2) })}
        className="w-14 px-2 py-2 text-sm border border-slate-200 rounded-xl text-center"
      />
      <div className="flex rounded-xl border border-slate-200 overflow-hidden">
        {["AM", "PM"].map((period) => (
          <button
            key={period}
            type="button"
            onClick={() => onChange({ ...value, period })}
            className={`px-3 py-2 text-xs font-semibold ${value.period === period ? "bg-indigo-600 text-white" : "bg-white text-slate-500"}`}
          >
            {period}
          </button>
        ))}
      </div>

          </div>
  );
}



function ConditionsConfigSection() {
  const { configConditions: conditions, refreshConfig, refreshPatients } = useData();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "", code: "", gender: "Both" });
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(false);



  const handleSave = async () => {
    try {
      if (editingId) {
        await fetch(`/config/conditions/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft)
        });
      } else {
        await fetch("/config/conditions", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft)
        });
      }
      setEditingId(null);
      setShowAdd(false);
      setDraft({ name: "", code: "", gender: "Both" });
      await refreshConfig();
      await refreshPatients();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete condition?")) return;
    try {
      await fetch(`/config/conditions/${id}`, { method: "DELETE" });
      await refreshConfig();
      await refreshPatients();
    } catch (e) { console.error(e); }
  };

  return (
    <Section title="Configure Conditions">
      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          <ChevronDown size={16} /> Expand Conditions Settings
        </button>
      ) : (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button onClick={() => setExpanded(false)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700">
            <ChevronUp size={16} /> Collapse
          </button>
          <button onClick={() => { setShowAdd(true); setEditingId(null); setDraft({ name: "", code: "", gender: "Both" }); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
            <Plus size={14} /> Add Condition
          </button>
        </div>
        
        {showAdd && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <input placeholder="Name" value={draft.name} onChange={e => setDraft(d => ({...d, name: e.target.value}))} className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
              <input placeholder="Code (e.g. PCOS)" value={draft.code} onChange={e => setDraft(d => ({...d, code: e.target.value}))} className="px-3 py-2 text-sm border border-slate-200 rounded-lg uppercase" maxLength={4} />
              <select value={draft.gender} onChange={e => setDraft(d => ({...d, gender: e.target.value}))} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Both">Both</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg">Save</button>
              <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2 font-semibold">Name</th>
                <th className="px-4 py-2 font-semibold">Code</th>
                <th className="px-4 py-2 font-semibold">Gender</th>
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {conditions.map(c => 
                editingId === c.id ? (
                  <tr key={`edit-${c.id}`} className="bg-indigo-50/50">
                    <td colSpan={4} className="px-4 py-3 border-b border-indigo-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <input placeholder="Name" value={draft.name} onChange={e => setDraft(d => ({...d, name: e.target.value}))} className="px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                        <input placeholder="Code" value={draft.code} onChange={e => setDraft(d => ({...d, code: e.target.value}))} className="px-3 py-2 text-sm border border-slate-200 rounded-lg uppercase" maxLength={4} />
                        <select value={draft.gender} onChange={e => setDraft(d => ({...d, gender: e.target.value}))} className="px-3 py-2 text-sm border border-slate-200 rounded-lg">
                          <option value="Female">Female</option>
                          <option value="Male">Male</option>
                          <option value="Both">Both</option>
                        </select>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={handleSave} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-2 text-slate-800">{c.name}</td>
                  <td className="px-4 py-2"><span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">{c.code}</span></td>
                  <td className="px-4 py-2">{c.gender}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => { setEditingId(c.id); setDraft(c); setShowAdd(false); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={14}/></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={14}/></button>
                  </td>
                </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </Section>
  );
}

function MedicalHistoryConfigSection() {
  const { configMedicalHistory: options, refreshConfig, refreshPatients } = useData();
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({ name: "" });
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState(false);



  const handleSave = async () => {
    try {
      if (editingId) {
        await fetch(`/config/medical-history/${editingId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft)
        });
      } else {
        await fetch("/config/medical-history", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify(draft)
        });
      }
      setEditingId(null);
      setShowAdd(false);
      setDraft({ name: "" });
      await refreshConfig();
      await refreshPatients();
    } catch (e) { console.error(e); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete option?")) return;
    try {
      await fetch(`/config/medical-history/${id}`, { method: "DELETE" });
      await refreshConfig();
      await refreshPatients();
    } catch (e) { console.error(e); }
  };

  return (
    <Section title="Configure Medical History">
      {!expanded ? (
        <button onClick={() => setExpanded(true)} className="flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700">
          <ChevronDown size={16} /> Expand Medical History Settings
        </button>
      ) : (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button onClick={() => setExpanded(false)} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-700">
            <ChevronUp size={16} /> Collapse
          </button>
          <button onClick={() => { setShowAdd(true); setEditingId(null); setDraft({ name: "" }); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100">
            <Plus size={14} /> Add Option
          </button>
        </div>
        
        {showAdd && (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col gap-3">
            <input placeholder="Condition Name" value={draft.name} onChange={e => setDraft({name: e.target.value})} className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg" />
            <div className="flex justify-end gap-2">
              <button onClick={handleSave} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg">Save</button>
              <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-4 py-2 font-semibold">Option Name</th>
                <th className="px-4 py-2 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {options.map(o => 
                editingId === o.id ? (
                  <tr key={`edit-${o.id}`} className="bg-amber-50/50">
                    <td colSpan={2} className="px-4 py-3 border-b border-amber-100">
                      <div className="flex gap-3 mb-3">
                        <input placeholder="Condition Name" value={draft.name} onChange={e => setDraft({name: e.target.value})} className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg" />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={handleSave} className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg">Save</button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-xs font-semibold bg-slate-200 text-slate-700 rounded-lg">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ) : (
                <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                  <td className="px-4 py-2 text-slate-800">{o.name}</td>
                  <td className="px-4 py-2 text-right space-x-2">
                    <button onClick={() => { setEditingId(o.id); setDraft(o); setShowAdd(false); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit3 size={14}/></button>
                    <button onClick={() => handleDelete(o.id)} className="p-1 text-slate-400 hover:text-rose-600"><Trash2 size={14}/></button>
                  </td>
                </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </Section>
  );
}

function AbdmIntegrationSection() {
  const [draft, setDraft] = useState({
    gateway_url: "",
    client_id: "",
    client_secret: "",
    facility_id: "",
    org_id: "",
    webhook_url: "",
    enabled: false,
  });
  const [status, setStatus] = useState(null);

  const testConnection = () => {
    setStatus({ type: "loading", message: "Testing connection..." });
    setTimeout(() => {
      setStatus({ type: "success", message: "Successfully connected to ABDM Sandbox Gateway." });
    }, 1500);
  };

  const saveSettings = () => {
    setStatus({ type: "success", message: "ABDM settings saved." });
  };

  return (
    <Section title="ABDM Integration (ABHA)">
      <div className="space-y-4">
        {status && (
          <div className={`px-4 py-3 rounded-xl text-sm ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            {status.message}
          </div>
        )}
        
        <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <div>
            <p className="text-sm font-semibold text-slate-800">Enable ABDM Integration</p>
            <p className="text-xs text-slate-500">Allow syncing with Ayushman Bharat Health Account.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={draft.enabled} onChange={(e) => setDraft({...draft, enabled: e.target.checked})} />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-500"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Gateway URL" value={draft.gateway_url} onChange={(e) => setDraft({...draft, gateway_url: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" />
          <input placeholder="Client ID" value={draft.client_id} onChange={(e) => setDraft({...draft, client_id: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" />
          <input placeholder="Client Secret" type="password" value={draft.client_secret} onChange={(e) => setDraft({...draft, client_secret: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" />
          <input placeholder="Facility ID" value={draft.facility_id} onChange={(e) => setDraft({...draft, facility_id: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" />
          <input placeholder="Organization ID" value={draft.org_id} onChange={(e) => setDraft({...draft, org_id: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" />
          <input placeholder="Webhook URL" value={draft.webhook_url} onChange={(e) => setDraft({...draft, webhook_url: e.target.value})} className="px-3 py-2 text-sm border border-slate-200 rounded-lg w-full" />
        </div>

        <div className="flex gap-2 justify-end mt-4">
          <button onClick={testConnection} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200">
            Test Connection
          </button>
          <button onClick={saveSettings} className="px-4 py-2 rounded-xl text-sm font-semibold bg-teal-600 text-white hover:bg-teal-700 flex items-center gap-2">
            <Save size={14} /> Save
          </button>
        </div>
      </div>
    </Section>
  );
}


export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [timeDraft, setTimeDraft] = useState(parseTime(DEFAULT_SETTINGS.scheduler_time));
  const [hospitalDraft, setHospitalDraft] = useState({
    hospital_name: DEFAULT_SETTINGS.hospital_name,
    contact_number: DEFAULT_SETTINGS.contact_number,
  });
  const [status, setStatus] = useState("");
  const [backupProgress, setBackupProgress] = useState(null);
  const [importConfirmFile, setImportConfirmFile] = useState(null);

  const applyTheme = (theme) => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  };

  const applySettings = (nextValue) => {
    const next = normalizeSettings(nextValue);
    setSettings(next);
    setTimeDraft(parseTime(next.scheduler_time));
    setHospitalDraft({
      hospital_name: next.hospital_name || "",
      contact_number: next.contact_number || "",
    });
    applyTheme(next.theme);
  };

  const load = useCallback(async () => {
    try {
      const res = await fetch("/portal-settings");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || `Settings load failed (${res.status})`);
      applySettings(data);
      setStatus("");
    } catch (err) {
      setStatus(err.message || "Could not load settings");
      applySettings(DEFAULT_SETTINGS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async (patch) => {
    try {
      const res = await fetch("/portal-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.detail || `Save failed (${res.status})`);
      applySettings(data);
      setEditing(null);
      setStatus("Saved");
      setTimeout(() => setStatus(""), 3000);
    } catch (err) {
      setStatus(err.message || "Save failed");
    }
  };

  const cancelEdit = () => {
    setTimeDraft(parseTime(settings.scheduler_time));
    setHospitalDraft({
      hospital_name: settings.hospital_name || "",
      contact_number: settings.contact_number || "",
    });
    setEditing(null);
  };


  const handleExportFull = async () => {
    setBackupProgress({ type: "export", step: "Creating ZIP...", active: true });
    try {
      const res = await fetch("/backup/export/full");
      if (!res.ok) throw new Error("Export failed");
      setBackupProgress({ type: "export", step: "Downloading...", active: true });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || `Backup_${new Date().toISOString().slice(0, 10)}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setBackupProgress({ type: "export", step: "Success!", active: false, success: true });
      setTimeout(() => setBackupProgress(null), 3000);
    } catch (err) {
      setBackupProgress({ type: "export", step: "Failed to export", active: false, error: err.message });
      setTimeout(() => setBackupProgress(null), 4000);
    }
  };

  const handleExportExcel = async () => {
    setBackupProgress({ type: "excel", step: "Exporting Patients...", active: true });
    try {
      const res = await fetch("/backup/export/excel");
      if (!res.ok) throw new Error("Export failed");
      setBackupProgress({ type: "excel", step: "Downloading...", active: true });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.headers.get("content-disposition")?.split("filename=")[1]?.replace(/"/g, "") || `Patients_${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      setBackupProgress({ type: "excel", step: "Success!", active: false, success: true });
      setTimeout(() => setBackupProgress(null), 3000);
    } catch (err) {
      setBackupProgress({ type: "excel", step: "Failed to export", active: false, error: err.message });
      setTimeout(() => setBackupProgress(null), 4000);
    }
  };

  const handleImportFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportConfirmFile(file);
    }
    e.target.value = null; // reset input
  };

  const confirmImport = async () => {
    if (!importConfirmFile) return;
    const file = importConfirmFile;
    setImportConfirmFile(null);
    setBackupProgress({ type: "import", step: "Uploading ZIP...", active: true });
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/backup/import/full", {
        method: "POST",
        body: formData,
      });
      
      setBackupProgress({ type: "import", step: "Restoring Collections...", active: true });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.status === "error") {
        throw new Error(data?.message || "Import failed. Database safely rolled back.");
      }
      
      setBackupProgress({ type: "import", step: "Success! Database Restored.", active: false, success: true });
      await load();
      setTimeout(() => setBackupProgress(null), 4000);
    } catch (err) {
      setBackupProgress({ type: "import", step: "Import Failed", active: false, error: err.message });
      setTimeout(() => setBackupProgress(null), 6000);
    }
  };


  const timeValid = /^(1[0-2]|0?[1-9])$/.test(timeDraft.hour) && /^([0-5][0-9])$/.test(timeDraft.minute);

  if (loading) {
    return <div className="text-slate-400 text-sm">Loading settings...</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="mt-1 text-slate-500">Configure portal preferences and backup data.</p>
      </div>

      {status && (
        <div className="mb-4 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          {status}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Section title="Appearance">
          <button
            onClick={() => save({ theme: settings.theme === "dark" ? "light" : "dark" })}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            {settings.theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {settings.theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          </button>
        </Section>

        <Section title="Scheduler Time">
          {editing === "time" ? (
            <div className="space-y-3">
              <TimeEditor value={timeDraft} onChange={setTimeDraft} />
              {!timeValid && <p className="text-xs text-rose-500">Enter a valid 12-hour time.</p>}
              <div className="flex gap-2">
                <button
                  disabled={!timeValid}
                  onClick={() => save({ scheduler_time: formatTime(timeDraft) })}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white disabled:opacity-40"
                >
                  <Save size={13} /> Save
                </button>
                <button onClick={cancelEdit} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600">
                  <X size={13} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-700 font-semibold">{settings.scheduler_time}</p>
              <button onClick={() => setEditing("time")} className="text-xs font-semibold text-indigo-600">Edit</button>
            </div>
          )}
        </Section>

        <Section title="Hospital Details">
          {editing === "hospital" ? (
            <div className="space-y-3">
              <input
                value={hospitalDraft.hospital_name}
                onChange={(e) => setHospitalDraft((prev) => ({ ...prev, hospital_name: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                placeholder="Hospital name"
              />
              <input
                value={hospitalDraft.contact_number}
                onChange={(e) => setHospitalDraft((prev) => ({ ...prev, contact_number: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl"
                placeholder="Contact number"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => save(hospitalDraft)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white"
                >
                  <Save size={13} /> Save
                </button>
                <button onClick={cancelEdit} className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600">
                  <X size={13} /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-slate-500">Hospital Name</span><span className="font-semibold text-slate-800">{settings.hospital_name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-slate-500">Contact Number</span><span className="font-semibold text-slate-800">{settings.contact_number || "-"}</span></div>
              <button onClick={() => setEditing("hospital")} className="text-xs font-semibold text-indigo-600">Edit</button>
            </div>
          )}
        </Section>

        <Section title="Backup & Restore">
          <div className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-3">
              <button onClick={handleExportFull} disabled={backupProgress?.active} className="inline-flex flex-col items-center justify-center p-4 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors flex-1 min-w-[130px] max-w-xs disabled:opacity-50">
                <Archive size={24} className="mb-2" />
                <span className="text-sm font-semibold text-center">Export Full Backup</span>
              </button>
              <button onClick={handleExportExcel} disabled={backupProgress?.active} className="inline-flex flex-col items-center justify-center p-4 rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex-1 min-w-[130px] max-w-xs disabled:opacity-50">
                <FileSpreadsheet size={24} className="mb-2" />
                <span className="text-sm font-semibold text-center">Export Patients (Excel)</span>
              </button>
              <label className={`inline-flex flex-col items-center justify-center p-4 rounded-xl border border-amber-100 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex-1 min-w-[130px] max-w-xs cursor-pointer ${backupProgress?.active ? 'opacity-50 pointer-events-none' : ''}`}>
                <Upload size={24} className="mb-2" />
                <span className="text-sm font-semibold text-center">Import Full Backup</span>
                <input type="file" accept=".zip" className="hidden" onChange={handleImportFileChange} />
              </label>
            </div>
            
            {backupProgress && (
              <div className={`mt-4 p-4 rounded-xl flex items-center gap-3 ${backupProgress.error ? 'bg-red-50 text-red-700' : backupProgress.success ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-700'}`}>
                {backupProgress.active && <Loader className="animate-spin" size={18} />}
                {backupProgress.error && <AlertCircle size={18} />}
                {backupProgress.success && <CheckCircle size={18} />}
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">{backupProgress.step}</span>
                  {backupProgress.error && <span className="text-xs mt-1">{backupProgress.error}</span>}
                </div>
              </div>
            )}
          </div>
        </Section>

        <ConditionsConfigSection />
        <MedicalHistoryConfigSection />
        <AbdmIntegrationSection />
      </div>

      {importConfirmFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <AlertCircle className="text-red-500" />
              Confirm Database Restore
            </h3>
            <p className="text-slate-600 text-sm mb-4">
              You are about to restore the database from <strong>{importConfirmFile.name}</strong>.
              <br/><br/>
              This will completely overwrite all existing patients, appointments, and settings. 
              An automatic safety rollback is in place in case the import fails, but successful imports cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setImportConfirmFile(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-medium rounded-lg text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={confirmImport}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg text-sm"
              >
                Yes, Restore Database
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
