// src/pages/Dashboard.jsx

import { Users, UserCheck, CalendarDays, CalendarClock, ClockAlert } from "lucide-react";
import { useData }         from "../context/DataContext";
import { useAppointments } from "../context/AppointmentsContext";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, loading }) {
  const accentMap = {
    teal:   { bg: "bg-teal-50",   icon: "text-teal-600"   },
    green:  { bg: "bg-green-50",  icon: "text-green-600"  },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600" },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-500"  },
  };
  const { bg, icon: iconColor } = accentMap[accent] || accentMap.teal;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6
                    flex items-center gap-5 hover:shadow-md transition-shadow duration-200">
      <div className={`${bg} ${iconColor} p-4 rounded-xl`}>
        <Icon size={24} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        {loading ? (
          <div className="h-8 w-16 bg-slate-100 rounded-lg animate-pulse mt-1" />
        ) : (
          <p className="text-3xl font-bold text-slate-800 mt-0.5">{value}</p>
        )}
      </div>
    </div>
  );
}

// ─── Date helpers ─────────────────────────────────────────────────────────────
function isSameDay(dateStr, target) {
  if (!dateStr || dateStr === "N/A") return false;
  const d = new Date(dateStr);
  return (
    d.getFullYear() === target.getFullYear() &&
    d.getMonth()    === target.getMonth()    &&
    d.getDate()     === target.getDate()
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { patients, loading: pLoading }   = useData();
  const { scheduled, requests, loading: aLoading } = useAppointments();

  const loading = pLoading || aLoading;

  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const totalPatients   = patients?.length ?? 0;
  const activePatients  = patients?.filter((p) => p.active).length ?? 0;
  const apptToday       = scheduled?.filter((a) => isSameDay(a.appointmentDate, today)).length    ?? 0;
  const apptTomorrow    = scheduled?.filter((a) => isSameDay(a.appointmentDate, tomorrow)).length ?? 0;
  const pendingRequests = requests?.length ?? 0;

  const stats = [
    { label: "Total Patients",               value: totalPatients,   icon: Users,         accent: "teal"   },
    { label: "Total Active Patients",        value: activePatients,  icon: UserCheck,     accent: "green"  },
    { label: "Appointments Today",           value: apptToday,       icon: CalendarDays,  accent: "indigo" },
    { label: "Appointments Tomorrow",        value: apptTomorrow,    icon: CalendarClock, accent: "violet" },
    { label: "Appointment Requests Pending", value: pendingRequests, icon: ClockAlert,    accent: "amber"  },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
        <p className="mt-1 text-slate-500">
          Welcome back — here's a snapshot of the portal today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      {!loading && totalPatients === 0 && (
        <div className="mt-8 bg-white rounded-2xl border border-dashed border-slate-200 p-10 text-center">
          <p className="text-slate-400 text-sm">
            No patients yet. Go to{" "}
            <span className="font-semibold text-slate-600">Patients</span> to add your first patient.
          </p>
        </div>
      )}
    </div>
  );
}