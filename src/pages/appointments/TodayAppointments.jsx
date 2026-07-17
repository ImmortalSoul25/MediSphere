import React, { useState, useEffect } from "react";
import { Plus, Clock, User, Calendar as CalendarIcon, CheckSquare, Search, PlusCircle, Eye } from "lucide-react";
import { useAppointments } from "../../context/AppointmentsContext";
import AppointmentFormModal from "../../components/AppointmentFormModal";
import { useNavigate } from "react-router-dom";

import { useData } from "../../context/DataContext";

// ─── Helpers ────────────────────────────────────────────────────────────────
function parseTime(timeStr) {
  if (!timeStr) return 0;
  let [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":");
  if (!hours) return 0;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10) || 0;
  
  if (modifier) {
    modifier = modifier.toUpperCase();
    if (hours === 12) {
      hours = modifier === "AM" ? 0 : 12;
    } else if (modifier === "PM") {
      hours += 12;
    }
  }
  
  return hours * 60 + minutes;
}

const APPT_TYPE_STYLES = {
  "First Consultation": "bg-indigo-50 text-indigo-700",
  "Follow Up": "bg-emerald-50 text-emerald-700",
  "Surgery": "bg-rose-50 text-rose-700",
  "Sonography": "bg-purple-50 text-purple-700",
  "Meeting": "bg-blue-50 text-blue-700",
  "Other": "bg-amber-50 text-amber-700",
};

function ApptTypeBadge({ type }) {
  if (!type) return <span className="text-slate-300 text-xs">—</span>;
  const style = APPT_TYPE_STYLES[type] || "bg-slate-100 text-slate-600";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${style}`}>
      {type}
    </span>
  );
}

export default function TodayAppointments() {
  const navigate = useNavigate();
  const { scheduled, loading, refresh, addDirectAppointment } = useAppointments();
  const { configConditions, patients } = useData();
  const [showAddModal, setShowAddModal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [inQueueIds, setInQueueIds] = useState(new Set());

  useEffect(() => {
    fetch("/queue-api")
      .then(r => r.json())
      .then(data => {
        const ids = new Set(data.filter(q => q.appointmentId).map(q => q.appointmentId));
        setInQueueIds(ids);
      })
      .catch(err => console.error("Failed to fetch queue", err));
  }, []);

  const todayStr = new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"
  
  // Filter for today only, and NOT in queue
  const todaysList = scheduled.filter(a => a.appointmentDate === todayStr && !inQueueIds.has(a.id));

  const handleBringToQueue = async (appt) => {
    try {
      let extra = { gender: "", conditions: [] };
      if (appt.patientId) {
        const res = await fetch(`/patient/view/det/${appt.patientId}`);
        if (res.ok) {
          const doc = await res.json();
          const pt = doc.metadata || {};
          
          let gen = pt.gender || "";
          if (gen.toLowerCase() === "m") gen = "Male";
          if (gen.toLowerCase() === "f") gen = "Female";

          const conditionNames = (pt.conditions || []).map(code => {
            const found = configConditions?.find(c => c.code === code);
            return found ? found.name : code;
          });

          extra = {
            gender: gen,
            conditions: conditionNames
          };
        }
      }

      const payload = {
        patientId: appt.patientId || "",
        appointmentId: appt.id || "",
        name: appt.patientName || "",
        contact: appt.contact || "",
        age: appt.age || "",
        appointmentType: appt.appointmentType || "",
        notes: appt.notes || appt.concern || "",
        type: "Patient",
        ...extra
      };
      
      const res = await fetch("/queue-api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        navigate("/queue");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // ─── Grouping Logic ───────────────────────────────────────────────────────
  const groups = {
    "Surgeries": [],
    "Afternoon": [],
    "Meetings": [],
    "Evening": [],
    "Sonography": [],
    "Other": []
  };

  todaysList.forEach(appt => {
    const type = appt.appointmentType;
    const timeMins = parseTime(appt.appointmentTime);
    
    // Grouping Rules
    if (type === "Surgery") {
      groups["Surgeries"].push(appt);
    } else if (type === "Sonography") {
      groups["Sonography"].push(appt);
    } else if (type === "Meeting") {
      groups["Meetings"].push(appt);
    } else if (type === "First Consultation" || type === "Follow Up") {
      // Afternoon: 12:15 PM (735 mins) to 3:00 PM (900 mins)
      if (timeMins >= 735 && timeMins <= 900) {
        groups["Afternoon"].push(appt);
      } 
      // Evening: 6:00 PM (1080 mins) to 8:30 PM (1230 mins)
      else if (timeMins >= 1080 && timeMins <= 1230) {
        groups["Evening"].push(appt);
      } 
      // Fits no time window
      else {
        groups["Other"].push(appt);
      }
    } else {
      groups["Other"].push(appt);
    }
  });

  // Sort each group by time
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => parseTime(a.appointmentTime) - parseTime(b.appointmentTime));
  });

  // Helper to render a group
  const renderGroup = (title, items, bgColor, headerColor, iconColor) => {
    // Optional client-side search filter
    const filtered = items.filter(i => i.patientName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // if (filtered.length === 0 && !searchTerm) return null; // Hide empty sections if not searching
    
    return (
      <div className={`mb-8 rounded-2xl border border-slate-200 overflow-hidden shadow-sm ${bgColor}`}>
        <div className={`px-6 py-3 border-b border-slate-200 flex items-center justify-between ${headerColor}`}>
          <h2 className="text-lg font-bold text-slate-800">{title}</h2>
          <span className={`text-sm font-semibold px-2.5 py-0.5 rounded-full ${iconColor} bg-white/60`}>
            {filtered.length}
          </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left table-fixed">
            <thead className="bg-white/50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-3 py-3 font-semibold w-20">ID</th>
                <th className="px-3 py-3 font-semibold w-32">Name</th>
                <th className="px-3 py-3 font-semibold w-24 hidden lg:table-cell">Contact</th>
                <th className="px-3 py-3 font-semibold w-12">Age</th>
                <th className="px-3 py-3 font-semibold w-20">Time</th>
                <th className="px-3 py-3 font-semibold w-28">Appt Type</th>
                <th className="px-3 py-3 font-semibold w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50 bg-white/40">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-sm text-slate-500 font-medium">No matches found.</td>
                </tr>
              ) : (
                filtered.map(appt => (
                  <tr key={appt.id} className="hover:bg-white/80 transition-colors duration-100">
                    <td className="px-3 py-2.5 font-mono text-slate-500 truncate">{appt.patientId || "-"}</td>
                    <td className="px-3 py-2.5 font-medium text-slate-800 truncate" title={appt.patientName}>{appt.patientName}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate hidden lg:table-cell">{appt.contactNumber || appt.contact}</td>
                    <td className="px-3 py-2.5 text-slate-600">{appt.age || "-"}</td>
                    <td className="px-3 py-2.5 text-slate-600 truncate">{appt.appointmentTime || "-"}</td>
                    <td className="px-3 py-2.5 truncate"><ApptTypeBadge type={appt.appointmentType} /></td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          title="View Patient Details" 
                          onClick={() => {
                             if (appt.patientId) {
                               navigate(`/patients/${appt.patientId}`);
                             }
                          }} 
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleBringToQueue(appt)}
                          className="flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded shadow-sm transition-colors"
                        >
                          <CheckSquare size={14} />
                          To Queue
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto w-full pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Today's Appointments</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            <CalendarIcon size={16} />
            {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Add Appointment</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="text-slate-500 font-medium text-sm animate-pulse">Loading today's schedule...</div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {renderGroup("Surgeries", groups["Surgeries"], "bg-rose-50", "bg-rose-100", "text-rose-700")}
          {renderGroup("Afternoon", groups["Afternoon"], "bg-orange-50", "bg-orange-100", "text-orange-700")}
          {renderGroup("Meetings", groups["Meetings"], "bg-sky-50", "bg-sky-100", "text-sky-700")}
          {renderGroup("Evening", groups["Evening"], "bg-indigo-50", "bg-indigo-100", "text-indigo-700")}
          {renderGroup("Sonography", groups["Sonography"], "bg-purple-50", "bg-purple-100", "text-purple-700")}
          {renderGroup("Other", groups["Other"], "bg-slate-50", "bg-slate-100", "text-slate-700")}
        </div>
      )}

      {showAddModal && (
        <AppointmentFormModal 
          patients={patients || []}
          onClose={() => setShowAddModal(false)}
          onConfirm={async (appt) => {
            setBusy(true);
            const err = await addDirectAppointment(appt);
            setBusy(false);
            if (!err) setShowAddModal(false);
          }}
          busy={busy}
          initialDate={todayStr}
        />
      )}
    </div>
  );
}
