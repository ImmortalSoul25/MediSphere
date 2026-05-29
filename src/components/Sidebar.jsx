// src/components/Sidebar.jsx

import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  MessageSquareText,
  Settings,
  ChevronDown,
  ClockAlert,
  CalendarCheck,
  CalendarX,
} from "lucide-react";

// ─── Simple nav item (no children) ───────────────────────────────────────────
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
          <Icon
            size={18}
            className={isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span>{label}</span>
          {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />}
        </>
      )}
    </NavLink>
  );
}

// ─── Expandable nav group (Appointments dropdown) ─────────────────────────────
const APPT_ROUTES = [
  "/appointments/requests",
  "/appointments/scheduled",
  "/appointments/past",
];

function NavGroup({ label, Icon, children }) {
  const location = useLocation();
  const isGroupActive = APPT_ROUTES.some((r) => location.pathname.startsWith(r));

  const [open, setOpen] = useState(isGroupActive);

  return (
    <div>
      {/* Group header button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={[
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
          isGroupActive
            ? "bg-slate-700/80 text-white"
            : "text-slate-300 hover:bg-slate-700/60 hover:text-white",
        ].join(" ")}
      >
        <Icon
          size={18}
          className={isGroupActive ? "text-indigo-300" : "text-slate-400 group-hover:text-slate-200"}
          strokeWidth={2}
        />
        <span className="flex-1 text-left">{label}</span>
        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Children */}
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
          <Icon
            size={15}
            className={isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span>{label}</span>
        </>
      )}
    </NavLink>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar() {
  return (
    <aside className="w-[260px] flex-shrink-0 flex flex-col min-h-screen bg-slate-900 select-none">

      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-700/60">
        <img
          src="/logo.jpg"
          alt="Portal"
          className="w-full h-26 object-contain object-left"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Main Menu
        </p>

        <NavItem to="/dashboard"    label="Dashboard"      Icon={LayoutDashboard} />
        <NavItem to="/patients"     label="Patients"       Icon={Users} />

        <NavGroup label="Appointments" Icon={CalendarDays}>
          <SubNavItem to="/appointments/requests"   label="Requests Pending"      Icon={ClockAlert} />
          <SubNavItem to="/appointments/scheduled"  label="Scheduled"             Icon={CalendarCheck} />
          <SubNavItem to="/appointments/past"       label="Past Appointments"     Icon={CalendarX} />
        </NavGroup>

        <NavItem to="/communications" label="Communications" Icon={MessageSquareText} />
        <NavItem to="/settings"       label="Settings"       Icon={Settings} />
      </nav>
    </aside>
  );
}