// src/pages/queue/AddQueueModal.jsx
import { useState, useEffect, useRef } from "react";
import { X, Search, User, Calendar, Loader, ChevronDown } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAppointments } from "../../context/AppointmentsContext";

function inputClass() {
  return "w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
}

import MultiSelectDropdown from "../../components/MultiSelectDropdown";

export default function AddQueueModal({ onClose, onAdded }) {
  const [type, setType] = useState("Patient");
  const { configConditions } = useData();
  const { scheduled, refresh } = useAppointments();
  
  const [form, setForm] = useState({
    patientId: "",
    appointmentId: "",
    name: "",
    gender: "",
    age: "",
    contact: "",
    appointmentType: "",
    conditions: [],
    company: "",
    notes: ""
  });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Scheduled Modal
  const [showScheduledModal, setShowScheduledModal] = useState(false);
  
  const abortControllerRef = useRef(null);
  
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    const timeout = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/patient/search?q=${encodeURIComponent(searchQuery)}`, { signal });
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch (e) {
        if (e.name !== 'AbortError') console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 200);
    
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const selectPatient = (p) => {
    let gen = p.metadata.gender || "";
    if (gen.toLowerCase() === "m") gen = "Male";
    if (gen.toLowerCase() === "f") gen = "Female";

    let patientAge = p.metadata.age || "";
    if (!patientAge && p.metadata.date_of_birth) {
      const dob = new Date(p.metadata.date_of_birth);
      const diff_ms = Date.now() - dob.getTime();
      const age_dt = new Date(diff_ms); 
      patientAge = Math.abs(age_dt.getUTCFullYear() - 1970).toString();
    }

    const conditionNames = (p.metadata.conditions || []).map(code => {
      const found = configConditions.find(c => c.code === code);
      return found ? found.name : code;
    });

    setForm(f => ({
      ...f,
      patientId: p.metadata.id || "",
      name: p.metadata.name || "",
      gender: gen,
      age: patientAge,
      contact: p.metadata.contact || "",
      conditions: conditionNames
    }));
    setSearchQuery("");
    setShowDropdown(false);
  };
  
  const selectScheduled = async (s) => {
    let extra = {};
    if (s.patientId) {
      try {
        const res = await fetch(`/patient/view/det/${s.patientId}`);
        if (res.ok) {
          const doc = await res.json();
          const pt = doc.metadata || {};
          
          let gen = pt.gender || "";
          if (gen.toLowerCase() === "m") gen = "Male";
          if (gen.toLowerCase() === "f") gen = "Female";

          let patientAge = pt.age || s.age || "";
          if (!patientAge && pt.date_of_birth) {
            const dob = new Date(pt.date_of_birth);
            const diff_ms = Date.now() - dob.getTime();
            const age_dt = new Date(diff_ms); 
            patientAge = Math.abs(age_dt.getUTCFullYear() - 1970).toString();
          }
          
          const conditionNames = (pt.conditions || []).map(code => {
            const found = configConditions.find(c => c.code === code);
            return found ? found.name : code;
          });

          extra = {
            gender: gen,
            age: patientAge,
            conditions: conditionNames
          };
        }
      } catch (e) {
        console.error("Failed to fetch patient details for scheduled appointment", e);
      }
    }

    setForm(f => ({
      ...f,
      patientId: s.patientId || "",
      appointmentId: s.id || "",
      name: s.patientName || "",
      contact: s.contact || "",
      age: s.age || "",
      appointmentType: s.appointmentType || "",
      notes: s.notes || s.concern || "",
      ...extra
    }));
    setSearchQuery("");
    setShowScheduledModal(false);
  };

  const handleConditionToggle = (c) => {
    setForm(f => {
      const conds = f.conditions.includes(c) ? f.conditions.filter(x => x !== c) : [...f.conditions, c];
      return { ...f, conditions: conds };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    
    try {
      const payload = { ...form, type };
      await fetch("/queue-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      onAdded();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">Add to Queue</h2>
          <button onClick={onClose} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
        </div>

        <div className="p-6 overflow-y-auto">
          {/* Segmented Buttons */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            {["Patient", "MR", "Other"].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${type === t ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t}
              </button>
            ))}
          </div>
          
          <form id="addQueueForm" onSubmit={handleSubmit} className="space-y-4">
            
            {type === "Patient" && (
              <>
                <div className="relative">
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Search Patient (ID / Name / Contact)</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Start typing..."
                      className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                    />
                    {isSearching && <Loader className="absolute right-3 top-2.5 text-slate-400 animate-spin" size={16} />}
                  </div>
                  
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((p, i) => (
                        <div key={i} onClick={() => selectPatient(p)} className="px-4 py-2 hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-0 flex items-center gap-3">
                          <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600"><User size={14}/></div>
                          <div>
                            <div className="text-sm font-semibold text-slate-700">{p.metadata.name}</div>
                            <div className="text-xs text-slate-500">{p.metadata.id} {p.metadata.contact && `• ${p.metadata.contact}`}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {showDropdown && searchResults.length === 0 && !isSearching && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg px-4 py-3 text-sm text-slate-500 text-center">
                      No matching patients found.
                    </div>
                  )}
                </div>
                
                <div className="flex justify-center">
                  <button type="button" onClick={() => setShowScheduledModal(true)} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg">
                    <Calendar size={16}/> Choose from Scheduled Today
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Patient ID</label>
                    <input className={inputClass()} value={form.patientId} onChange={e => setForm({...form, patientId: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Name *</label>
                    <input className={inputClass()} required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Gender</label>
                    <select className={inputClass()} value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                      <option value="">Select...</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Age</label>
                    <input type="number" className={inputClass()} value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Contact Number</label>
                  <input className={inputClass()} value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Appointment Type</label>
                  <select className={inputClass()} value={form.appointmentType} onChange={e => setForm({...form, appointmentType: e.target.value})}>
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
                </div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Conditions</label>
                  <MultiSelectDropdown
                    label="Conditions"
                    options={configConditions.map(c => ({ value: c.name, label: c.name }))}
                    selected={form.conditions}
                    onChange={(selected) => setForm({ ...form, conditions: selected })}
                  />
                </div>
              </>
            )}
            
            {type !== "Patient" && (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Name *</label>
                  <input className={inputClass()} required value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Contact Number</label>
                  <input className={inputClass()} value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
                </div>
                {type === "MR" && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1.5">Company Name</label>
                    <input className={inputClass()} value={form.company} onChange={e => setForm({...form, company: e.target.value})} />
                  </div>
                )}
              </>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Appointment Notes (Optional)</label>
              <textarea rows={2} className={inputClass()} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
            </div>
            
          </form>
        </div>
        
        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-200 transition-colors">Cancel</button>
          <button type="submit" form="addQueueForm" className="px-6 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all">Add to Queue</button>
        </div>
        
      </div>
      
      {showScheduledModal && (
        <div className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-[2px] flex justify-center items-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-lg flex flex-col max-h-[80vh]">
            <div className="flex justify-between items-center px-5 py-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800">Scheduled Today</h3>
              <button onClick={() => setShowScheduledModal(false)} className="text-slate-400 hover:bg-slate-100 p-1.5 rounded-full"><X size={18}/></button>
            </div>
            <div className="p-2 overflow-y-auto">
              {scheduled.filter(s => s.appointmentDate === new Date().toLocaleDateString("en-CA")).length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">No scheduled appointments for today.</div>
              ) : (
                scheduled.filter(s => s.appointmentDate === new Date().toLocaleDateString("en-CA")).map(s => (
                  <button key={s.id} onClick={() => selectScheduled(s)} className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-50 last:border-0 rounded-lg">
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-slate-700">{s.patientName}</div>
                      <div className="text-xs font-mono bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">{s.appointmentTime}</div>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">{s.patientId} {s.contact && `• ${s.contact}`}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
