import React, { useState, useEffect } from "react";
import { Users, UserCheck, CalendarDays, CalendarClock, ClockAlert, ShieldCheck, FileText, AlertCircle, Calendar as CalendarIcon, Clock, Gift, Activity } from "lucide-react";
import { useData }         from "../context/DataContext";
import { useAppointments } from "../context/AppointmentsContext";
import { useNavigate } from "react-router-dom";

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, accent, loading }) {
  const accentMap = {
    teal:   { bg: "bg-teal-50",   icon: "text-teal-600"   },
    green:  { bg: "bg-green-50",  icon: "text-green-600"  },
    indigo: { bg: "bg-indigo-50", icon: "text-indigo-600" },
    violet: { bg: "bg-violet-50", icon: "text-violet-600" },
    amber:  { bg: "bg-amber-50",  icon: "text-amber-500"  },
    blue:   { bg: "bg-blue-50",   icon: "text-blue-600"   },
    rose:   { bg: "bg-rose-50",   icon: "text-rose-600"   },
    pink:   { bg: "bg-pink-50",   icon: "text-pink-600"   },
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
  const navigate = useNavigate();
  const { patients, loading: pLoading }   = useData();
  const { scheduled, requests, loading: aLoading } = useAppointments();
  
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/calendar-api");
        const data = await res.json();
        setEvents(data);
      } catch (err) {
        console.error("Failed to fetch events", err);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const loading = pLoading || aLoading || eventsLoading;

  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  
  const thisMonth = today.getMonth();

  const totalPatients   = patients?.length ?? 0;
  const activePatients = patients?.filter((p) => p.is_active).length ?? 0;
  const apptToday       = scheduled?.filter((a) => isSameDay(a.appointmentDate, today)).length    ?? 0;
  const apptTomorrow    = scheduled?.filter((a) => isSameDay(a.appointmentDate, tomorrow)).length ?? 0;
  const pendingRequests = requests?.length ?? 0;

  const abhaLinked      = patients?.filter((p) => p.abhaLinked).length ?? 0;
  
  // Calendar Stats
  const activeEvents = events.filter(e => e.status === "Active");
  const eventsTodayCount = activeEvents.filter(e => e.startDate <= todayStr && (!e.endDate || e.endDate >= todayStr)).length;
  
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  const next7DaysStr = next7Days.toISOString().split("T")[0];
  const upcomingThisWeek = activeEvents.filter(e => e.startDate > todayStr && e.startDate <= next7DaysStr).length;
  
  const birthdaysThisMonth = activeEvents.filter(e => e.type === "Birthday" && new Date(e.startDate).getMonth() === thisMonth).length;

  const stats = [
    { label: "Total Patients",               value: totalPatients,      icon: Users,         accent: "teal"   },
    { label: "Total Active Patients",        value: activePatients,     icon: UserCheck,     accent: "green"  },
    { label: "Appointments Today",           value: apptToday,          icon: CalendarDays,  accent: "indigo" },
    { label: "Appointments Tomorrow",        value: apptTomorrow,       icon: CalendarClock, accent: "violet" },
    { label: "Appointment Requests Pending", value: pendingRequests,    icon: ClockAlert,    accent: "amber"  },
    { label: "ABHA Linked Patients",         value: abhaLinked,         icon: ShieldCheck,   accent: "blue"   },
    { label: "Events Today",                 value: eventsTodayCount,   icon: Clock,         accent: "amber"  },
    { label: "Upcoming This Week",           value: upcomingThisWeek,   icon: CalendarIcon,  accent: "indigo" },
    { label: "Birthdays This Month",         value: birthdaysThisMonth, icon: Gift,          accent: "pink"   },
  ];

  // Upcoming 5 events sorted by start date
  const upcomingEvents = activeEvents
    .filter(e => e.startDate >= todayStr)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);

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

      <div className="mt-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon size={20} className="text-indigo-600" />
              <h2 className="font-bold text-slate-800">Upcoming Events</h2>
            </div>
            <button onClick={() => navigate("/calendar")} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition">
              View Calendar &rarr;
            </button>
          </div>
          <div className="p-0">
            {eventsLoading ? (
              <div className="p-6 text-center text-slate-500">Loading events...</div>
            ) : upcomingEvents.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No upcoming events.</div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {upcomingEvents.map(event => (
                  <li key={event.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {event.type === "Birthday" ? "🎂 " : ""}{event.title}
                      </p>
                      <p className="text-sm text-slate-500 mt-0.5">
                        {new Date(event.startDate).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                        {!event.allDay && event.startTime && ` • ${event.startTime}`}
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700">
                      {event.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
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