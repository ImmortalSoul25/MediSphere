import React, { useState, useEffect } from "react";
import { Users, UserCheck, CalendarDays, ClockAlert, Calendar as CalendarIcon, Clock, X } from "lucide-react";
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

// ─── Event Colors ─────────────────────────────────────────────────────────────
const EVENT_COLORS = {
  "Hospital Event": "bg-slate-100 text-slate-800",
  "Birthday": "bg-sky-100 text-sky-800",
  "Meeting": "bg-green-100 text-green-800",
  "Leave / Holiday": "bg-yellow-100 text-yellow-800",
  "Reminder": "bg-orange-100 text-orange-800",
  "Pregnancy Due Date": "bg-red-100 text-red-800",
  "School Lecture/ Conference/Talk": "bg-purple-100 text-purple-800",
  "Other": "bg-orange-50 text-orange-800",
};

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const { patients, loading: pLoading }   = useData();
  const { scheduled, requests, loading: aLoading, dismissRequestNotification } = useAppointments();
  
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [dismissingIds, setDismissingIds] = useState(new Set());

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

  useEffect(() => {
    fetchEvents();
    
    // Polling every 30 seconds for Calendar Events. (Requests are polled via Context)
    const interval = setInterval(fetchEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleDismissCalendarEvent = async (id) => {
    setDismissingIds(prev => new Set(prev).add(id));
    try {
      await fetch(`/calendar-api/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Dismissed" })
      });
      fetchEvents();
    } catch (error) {
      console.error("Failed to dismiss", error);
    } finally {
      setDismissingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDismissRequest = async (id) => {
    setDismissingIds(prev => new Set(prev).add(id));
    await dismissRequestNotification(id);
    setDismissingIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const loading = pLoading || aLoading || eventsLoading;

  const today    = new Date();
  const todayStr = today.toISOString().split("T")[0];
  
  const totalPatients   = patients?.length ?? 0;
  const activePatients = patients?.filter((p) => p.is_active).length ?? 0;
  const apptToday       = scheduled?.filter((a) => isSameDay(a.appointmentDate, today)).length    ?? 0;
  const pendingRequests = requests?.length ?? 0;

  // Calendar Stats
  const activeEvents = events.filter(e => e.status === "Active");
  const eventsTodayCount = activeEvents.filter(e => e.type !== "Reminder" && e.startDate <= todayStr && (!e.endDate || e.endDate >= todayStr)).length;
  
  const next7Days = new Date(today);
  next7Days.setDate(today.getDate() + 7);
  const next7DaysStr = next7Days.toISOString().split("T")[0];
  const upcomingThisWeek = activeEvents.filter(e => e.type !== "Reminder" && e.startDate > todayStr && e.startDate <= next7DaysStr).length;

  const stats = [
    { label: "Total Patients",               value: totalPatients,      icon: Users,         accent: "teal"   },
    { label: "Active Patients",              value: activePatients,     icon: UserCheck,     accent: "green"  },
    { label: "Appts Today",                  value: apptToday,          icon: CalendarDays,  accent: "indigo" },
    { label: "Pending Requests",             value: pendingRequests,    icon: ClockAlert,    accent: "amber"  },
    { label: "Events Today",                 value: eventsTodayCount,   icon: Clock,         accent: "pink"   },
    { label: "Upcoming Week",                value: upcomingThisWeek,   icon: CalendarIcon,  accent: "blue"   },
  ];

  // Upcoming 5 events sorted by start date
  const upcomingEvents = activeEvents
    .filter(e => e.type !== "Reminder" && e.startDate >= todayStr)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .slice(0, 5);
    
  // Combine Calendar Reminders + Appointment Requests Notifications
  const calendarReminders = activeEvents.filter(e => e.type === "Reminder").map(e => ({
    id: e.id || e._id,
    type: "calendar",
    title: e.title,
    dateStr: e.startDate,
    timeStr: e.startTime,
    createdAt: e.createdAt,
    colorClass: EVENT_COLORS["Reminder"],
  }));
  
  const requestReminders = requests?.filter(r => !r.notificationDismissed).map(r => ({
    id: r.id,
    type: "request",
    title: `New Appointment Request: ${r.patientName}`,
    dateStr: r.requestedDateDisplay,
    timeStr: r.requestedSlot,
    createdAt: r.requestedOn,
    colorClass: "bg-pink-100 text-pink-800", // Light Pink as requested
  })) || [];
  
  const allReminders = [...calendarReminders, ...requestReminders]
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); // Latest on top

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="mt-1 text-slate-500">
            Welcome back — here's a snapshot of the portal today.
          </p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => navigate("/appointments/today")}
            className="flex-1 sm:flex-none bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm"
          >
            Today's Appointments
          </button>
          <button 
            onClick={() => navigate("/queue")}
            className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition shadow-sm"
          >
            Manage Queue
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch pb-12">
        {/* Left Side: Cards and Upcoming Events */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map((s) => (
              <StatCard key={s.label} {...s} loading={loading} />
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex-1">
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
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${EVENT_COLORS[event.type] || EVENT_COLORS["Other"]}`}>
                        {event.type}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Reminders Box */}
        <div className="lg:w-1/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" style={{ minHeight: "500px" }}>
          <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={20} className="text-orange-600" />
              <h2 className="font-bold text-slate-800">Reminders</h2>
            </div>
            <span className="bg-orange-100 text-orange-700 py-0.5 px-2 rounded-full text-xs font-bold">
              {allReminders.length}
            </span>
          </div>
          <div className="p-4 overflow-y-auto max-h-[600px] flex-1">
            {loading ? (
              <div className="text-center text-slate-500 mt-4">Loading reminders...</div>
            ) : allReminders.length === 0 ? (
              <div className="text-center text-slate-500 mt-4 text-sm font-medium">No new reminders</div>
            ) : (
              <div className="space-y-3">
                {allReminders.map(rem => {
                  const isDismissing = dismissingIds.has(rem.id);
                  return (
                    <div key={rem.id} className={`${rem.colorClass} border border-white/20 p-3 rounded-xl flex items-start justify-between gap-3 shadow-sm transition-all ${isDismissing ? 'opacity-50 scale-95' : ''}`}>
                      <div className="flex-1">
                        <p className="font-bold text-sm leading-tight mb-1">{rem.title}</p>
                        <p className="text-xs opacity-80 font-medium">
                          {rem.dateStr ? new Date(rem.dateStr).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Any Date"}
                          {rem.timeStr ? ` • ${rem.timeStr}` : ""}
                        </p>
                      </div>
                      <button 
                        onClick={() => rem.type === "calendar" ? handleDismissCalendarEvent(rem.id) : handleDismissRequest(rem.id)} 
                        disabled={isDismissing}
                        className="p-1 hover:bg-black/10 rounded-full transition-colors flex-shrink-0"
                        title="Dismiss"
                      >
                        <X size={16} strokeWidth={2.5} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}