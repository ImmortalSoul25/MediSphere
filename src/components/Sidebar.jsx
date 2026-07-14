// src/components/Sidebar.jsx

import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Send,
  FileText,
  Settings,
  ChevronDown,
  ClockAlert,
  CalendarCheck,
  CalendarX,
  ListTodo
} from "lucide-react";

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
          isActive
            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-900/30"
            : "text-slate-300 hover:bg-slate-700/60 hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={18}
            className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}
            strokeWidth={isActive ? 2.5 : 2} />
          <span>{label}</span>
          {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />}
        </>
      )}
    </NavLink>
  );
}

const APPT_ROUTES = [
  "/appointments/requests",
  "/appointments/scheduled",
  "/appointments/past",
];

function NavGroup({ label, Icon, children }) {
  const location     = useLocation();
  const isGroupActive = APPT_ROUTES.some((r) => location.pathname.startsWith(r));
  const [open, setOpen] = useState(isGroupActive);

  return (
    <div>
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
          isGroupActive
            ? "bg-slate-700/80 text-white"
            : "text-slate-300 hover:bg-slate-700/60 hover:text-white",
        ].join(" ")}
      >
        <Icon size={18}
          className={isGroupActive ? "text-indigo-300" : "text-slate-400 group-hover:text-slate-200"}
          strokeWidth={2} />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-0.5 ml-4 pl-3 border-l border-slate-700 space-y-0.5">
          {children}
        </div>
      )}
    </div>
  );
}

function SubNavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 group",
          isActive
            ? "bg-indigo-600 text-white shadow-sm"
            : "text-slate-400 hover:bg-slate-700/60 hover:text-white",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon size={15}
            className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}
            strokeWidth={isActive ? 2.5 : 2} />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col h-screen sticky top-0 bg-slate-900 select-none">

      <div className="px-5 py-4 border-b border-slate-700/60">
        <img src="/logo.jpg" alt="Portal"
          className="w-full h-26 object-contain object-left" />
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        <NavItem to="/dashboard"         label="Dashboard"          Icon={LayoutDashboard} />
        <NavItem to="/calendar"          label="Calendar"           Icon={CalendarDays} />
        <NavItem to="/queue"             label="Queue"              Icon={ListTodo} />
        <NavItem to="/patients"          label="Patients"           Icon={Users} />

        <NavGroup label="Appointments" Icon={CalendarDays}>
          <SubNavItem to="/appointments/requests"  label="Requests Pending"  Icon={ClockAlert} />
          <SubNavItem to="/appointments/scheduled" label="Scheduled"         Icon={CalendarCheck} />
          <SubNavItem to="/appointments/past"      label="Past Appointments" Icon={CalendarX} />
        </NavGroup>

        <NavItem to="/send-messages"     label="Send Messages"      Icon={Send} />
        <NavItem to="/message-templates" label="Message Templates"  Icon={FileText} />
        <NavItem to="/settings"          label="Settings"           Icon={Settings} />
      </nav>

      <div className="px-5 py-4 border-t border-slate-700/60 mt-auto">
        <Clock />
      </div>
    </aside>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const d = time.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
  
  const t = time.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  }).toUpperCase();

  return (
    <div className="flex flex-col items-center justify-center bg-slate-800/50 rounded-lg p-2 border border-slate-700/50">
      <span className="text-xs font-semibold text-slate-300 tracking-wider">{d}</span>
      <span className="text-[11px] font-mono text-indigo-300 mt-0.5">{t}</span>
    </div>
  );
}