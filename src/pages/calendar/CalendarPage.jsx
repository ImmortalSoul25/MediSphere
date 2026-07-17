import React, { useState, useEffect } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Calendar as CalendarIcon, Clock, Users, Coffee, Gift, Plus, Search, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EVENT_COLORS = {
  "Hospital Event": "#e2e8f0", // Light Grey
  "Birthday": "#bae6fd", // Light Blue
  "Meeting": "#bbf7d0", // Light Green
  "Leave / Holiday": "#fef08a", // Light Yellow
  "Reminder": "#fed7aa", // Light Orange
  "Pregnancy Due Date": "#fecaca", // Light Red
  "School Lecture/ Conference/Talk": "#e9d5ff", // Light Purple
  "Other": "#fed7aa", // Light Brown
};

const getCustomMonthlyDate = (year, month, weekStr, dayStr) => {
  const daysMap = { "Sunday": 0, "Monday": 1, "Tuesday": 2, "Wednesday": 3, "Thursday": 4, "Friday": 5, "Saturday": 6 };
  const targetDay = daysMap[dayStr];
  if (targetDay === undefined) return null;
  
  const firstDayOfMonth = new Date(year, month, 1);
  const currentDay = firstDayOfMonth.getDay();
  const offset = (targetDay - currentDay + 7) % 7;
  
  let targetDate = new Date(year, month, 1 + offset);
  
  if (weekStr === "2nd") targetDate.setDate(targetDate.getDate() + 7);
  else if (weekStr === "3rd") targetDate.setDate(targetDate.getDate() + 14);
  else if (weekStr === "4th") targetDate.setDate(targetDate.getDate() + 21);
  else if (weekStr === "Last") {
      while (targetDate.getMonth() === month) targetDate.setDate(targetDate.getDate() + 7);
      targetDate.setDate(targetDate.getDate() - 7);
  }
  
  return targetDate;
};

function StatCard({ label, value, Icon, colorClass }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");
  const [view, setView] = useState("month");
  const [date, setDate] = useState(new Date());
  
  const fetchEvents = async () => {
    try {
      const res = await fetch("/calendar-api");
      const data = await res.json();
      
      const expandedEvents = [];
      
      data.forEach(e => {
        const createInstance = (baseDate, baseEndDate, index) => {
          let start, end;
          if (e.allDay || (!e.startTime && !e.endTime)) {
            // For allDay events, endDate is hidden in the form and might be stale (e.g. less than startDate)
            // Force end to be the same as baseDate.
            start = new Date(baseDate + "T00:00:00");
            end = new Date(baseDate + "T23:59:59");
          } else {
            // Ensure safe parsing if startTime is somehow invalid
            const safeStartTime = e.startTime && e.startTime.includes(":") ? e.startTime : "00:00";
            const safeEndTime = e.endTime && e.endTime.includes(":") ? e.endTime : "23:59";
            
            // Fix stale end dates
            let safeBaseEndDate = baseEndDate || baseDate;
            if (safeBaseEndDate < baseDate) {
              safeBaseEndDate = baseDate;
            }
            
            start = new Date(baseDate + "T" + safeStartTime);
            end = new Date(safeBaseEndDate + "T" + safeEndTime);
          }
          
          if (isNaN(start.getTime()) || isNaN(end.getTime())) {
            console.error("Invalid date parsing for event:", e);
            start = new Date(baseDate + "T00:00:00");
            end = new Date(baseDate + "T23:59:59");
          }
          
          return {
            ...e,
            id: e.id + (index ? `_instance_${index}` : ""),
            allDay: e.allDay || (!e.startTime && !e.endTime), // Ensure allDay is explicitly true/false
            start,
            end,
            title: e.type === "Birthday" ? `🎂 ${e.title}` : e.title,
            instanceDate: baseDate,
          };
        };

        const startDate = new Date(e.startDate);
        expandedEvents.push(createInstance(e.startDate, e.endDate, 0));

        if (e.repeat && e.repeat !== "Does Not Repeat") {
          const yearsToExpand = e.type === "Birthday" ? 10 : 3;
          const maxDate = new Date(startDate);
          maxDate.setFullYear(maxDate.getFullYear() + yearsToExpand);
          
          let currentDate = new Date(startDate);
          let index = 1;
          
          while (true) {
            if (e.repeat === "Daily") {
              currentDate.setDate(currentDate.getDate() + 1);
            } else if (e.repeat === "Weekly") {
              currentDate.setDate(currentDate.getDate() + 7);
            } else if (e.repeat === "Monthly") {
              currentDate.setMonth(currentDate.getMonth() + 1);
            } else if (e.repeat === "Yearly") {
              currentDate.setFullYear(currentDate.getFullYear() + 1);
            } else if (e.repeat === "Custom Monthly") {
              currentDate.setMonth(currentDate.getMonth() + 1);
              currentDate = getCustomMonthlyDate(currentDate.getFullYear(), currentDate.getMonth(), e.customRepeatWeek || "1st", e.customRepeatDay || "Monday");
              if (!currentDate) break;
            } else {
              break;
            }
            
            if (currentDate > maxDate) break;
            
            const dateStr = format(currentDate, "yyyy-MM-dd");
            let endDateStr = dateStr;
            if (e.endDate) {
              const diffTime = Math.abs(new Date(e.endDate) - startDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              const newEnd = new Date(currentDate);
              newEnd.setDate(newEnd.getDate() + diffDays);
              endDateStr = format(newEnd, "yyyy-MM-dd");
            }
            
            expandedEvents.push(createInstance(dateStr, endDateStr, index));
            index++;
          }
        }
      });
      
      setEvents(expandedEvents);
    } catch (error) {
      console.error("Failed to fetch events", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const eventStyleGetter = (event) => {
    const backgroundColor = EVENT_COLORS[event.type] || EVENT_COLORS["Other"];
    return {
      style: {
        backgroundColor,
        borderRadius: "4px",
        opacity: 0.9,
        color: ["#e2e8f0", "#fef08a"].includes(backgroundColor) ? "#334155" : "#1e293b", // Darker text for light backgrounds
        border: "0px",
        display: "block",
        padding: "2px 6px",
        fontSize: "13px",
        fontWeight: "600",
      }
    };
  };

  const handleSelectSlot = ({ start }) => {
    if (view === "month") {
      setDate(start);
      setView("day");
    } else {
      navigate(`/calendar/add?date=${format(start, "yyyy-MM-dd")}&time=${format(start, "HH:mm")}`);
    }
  };

  const handleSelectEvent = (event) => {
    // If it's a generated instance, `event.id` might look like `uuid_instance_1`, split it to edit the original
    const originalId = event.id.split('_instance_')[0];
    navigate(`/calendar/${originalId}/edit`);
  };
  
  // Calculate Stats
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  
  const activeEvents = events.filter(e => e.status === "Active" || !e.status);
  const eventsToday = activeEvents.filter(e => e.type !== "Reminder" && format(e.start, "yyyy-MM-dd") <= todayStr && format(e.end, "yyyy-MM-dd") >= todayStr).length;
  
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();
  const birthdaysThisMonth = activeEvents.filter(e => e.type === "Birthday" && e.start.getMonth() === thisMonth && e.start.getFullYear() === thisYear).length;
  const meetingsThisMonth = activeEvents.filter(e => e.type === "Meeting" && e.start.getMonth() === thisMonth && e.start.getFullYear() === thisYear).length;
  const leavesThisMonth = activeEvents.filter(e => e.type === "Leave / Holiday" && e.start.getMonth() === thisMonth && e.start.getFullYear() === thisYear).length;

  const filteredEvents = activeEvents.filter(e => {
    if (e.type === "Reminder") return false; // Hide from calendar grid entirely
    if (filterType !== "All" && e.type !== filterType) return false;
    if (searchTerm && !e.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const CustomToolbar = (toolbar) => {
    const goToBack = () => toolbar.onNavigate('PREV');
    const goToNext = () => toolbar.onNavigate('NEXT');
    const goToCurrent = () => toolbar.onNavigate('TODAY');

    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={goToBack} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"><ChevronLeft size={20} /></button>
          <button onClick={goToCurrent} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition">Today</button>
          <button onClick={goToNext} className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition"><ChevronRight size={20} /></button>
          <span className="ml-4 text-xl font-bold text-slate-800">{toolbar.label}</span>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button onClick={() => toolbar.onView('month')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${toolbar.view === 'month' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Month</button>
          <button onClick={() => toolbar.onView('day')} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition ${toolbar.view === 'day' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>Day</button>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Calendar</h1>
          <p className="text-sm text-slate-500 mt-1">Manage hospital events, meetings, and schedules</p>
        </div>
        <button onClick={() => navigate("/calendar/add")} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors">
          <Plus size={18} /> Add Event
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Events Today" value={eventsToday} Icon={Clock} colorClass="bg-amber-100 text-amber-700" />
        <StatCard label="Birthdays This Month" value={birthdaysThisMonth} Icon={Gift} colorClass="bg-pink-100 text-pink-700" />
        <StatCard label="Meetings This Month" value={meetingsThisMonth} Icon={Users} colorClass="bg-blue-100 text-blue-700" />
        <StatCard label="Leaves This Month" value={leavesThisMonth} Icon={Coffee} colorClass="bg-red-100 text-red-700" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search events..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="w-full md:w-64 relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
            >
              <option value="All">All Types</option>
              <option value="Hospital Event">Hospital Event</option>
              <option value="Birthday">Birthday</option>
              <option value="Meeting">Meeting</option>
              <option value="Leave / Holiday">Leave / Holiday</option>
              <option value="Reminder">Reminder</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="h-[700px]">
          <Calendar
            localizer={localizer}
            events={filteredEvents}
            startAccessor="start"
            endAccessor="end"
            allDayAccessor="allDay"
            style={{ height: "100%", fontFamily: "inherit" }}
            eventPropGetter={eventStyleGetter}
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            selectable
            popup
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            views={["month", "day"]}
            step={60}
            timeslots={1}
            messages={{ allDay: "All Day" }}
            components={{
              toolbar: CustomToolbar
            }}
          />
        </div>
      </div>
    </div>
  );
}
