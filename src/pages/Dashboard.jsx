// src/pages/Dashboard.jsx

import { Users, MessageSquare, AlertTriangle, UserCheck, XCircle, Clock } from "lucide-react";
import { useData } from "../context/DataContext";

function StatCard({ label, value, icon: Icon, accent }) {
  const accentMap = {
    teal:  { bg: "bg-teal-50",  icon: "text-teal-600"  },
    blue:  { bg: "bg-blue-50",  icon: "text-blue-600"  },
    rose:  { bg: "bg-rose-50",  icon: "text-rose-600"  },
    green: { bg: "bg-green-50", icon: "text-green-600" },
    red:   { bg: "bg-red-50",   icon: "text-red-500"   },
    amber: { bg: "bg-amber-50", icon: "text-amber-500" },
  };
  const { bg, icon: iconColor } = accentMap[accent] || accentMap.teal;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow duration-200">
      <div className={`${bg} ${iconColor} p-4 rounded-xl`}>
        <Icon size={24} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { patients } = useData();

  // Derive stats from real patient data
  const total        = patients?.length ?? 0;
  const active       = patients?.filter((p) => p.active).length ?? 0;
  const inactive     = total - active;

  // High risk: patients whose due date is within the next 4 weeks
  // If you don't track risk separately, we use inactive as a proxy for now
  // You can replace this logic with a real `highRisk` field later
  // temporary comment
  const highRisk = patients?.filter((p) => {
    if (!p.dueDate || p.dueDate === "N/A") return false;
    // Parse DD/MM/YY
    const parts = p.dueDate.split("/");
    if (parts.length !== 3) return false;
    const due = new Date(`20${parts[2]}`, parts[1] - 1, parts[0]);
    const now  = new Date();
    const weeksUntilDue = (due - now) / (1000 * 60 * 60 * 24 * 7);
    return weeksUntilDue >= 0 && weeksUntilDue <= 4;
  }).length ?? 0;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Welcome back — here's what's happening in the Maternal Care Portal.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <StatCard label="Total Patients"        value={total}    icon={Users}         accent="teal"  />
        <StatCard label="Active Patients"        value={active}   icon={UserCheck}     accent="green" />
        <StatCard label="Inactive Patients"      value={inactive} icon={XCircle}       accent="red"   />
        <StatCard label="Due Within 4 Weeks"     value={highRisk} icon={AlertTriangle} accent="rose"  />
        <StatCard label="Total Messages Sent"    value="—"        icon={MessageSquare} accent="blue"  />
        <StatCard label="Messages Pending"       value="—"        icon={Clock}         accent="amber" />
      </div>

      {patients?.length === 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm">No patients yet. Go to <span className="font-semibold text-slate-600">Patients</span> to add your first patient.</p>
        </div>
      )}
    </div>
  );
}