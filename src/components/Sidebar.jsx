// src/components/Sidebar.jsx

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  MessageSquareText,
  ClipboardList,
} from 'lucide-react'

const mainNavItems = [
  { to: '/dashboard', label: 'Dashboard',  Icon: LayoutDashboard },
  { to: '/patients',  label: 'Patients',   Icon: Users },
  { to: '/templates', label: 'Templates',  Icon: MessageSquareText },
  { to: '/logs',      label: 'Send Logs',  Icon: ClipboardList },
]

function NavItem({ to, label, Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group',
          isActive
            ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-900/30'
            : 'text-slate-300 hover:bg-slate-700/60 hover:text-white',
        ].join(' ')
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}
            strokeWidth={isActive ? 2.5 : 2}
          />
          <span>{label}</span>
          {isActive && (
            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-300" />
          )}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  return (
    // min-h-screen ensures the sidebar always reaches the bottom of the viewport
    <aside className="w-[260px] flex-shrink-0 flex flex-col min-h-screen bg-slate-900 select-none">

      {/* ── LOGO AREA ─────────────────────────────────────────────────────── */}
      <div className="px-5 py-4 border-b border-slate-700/60">
        <img
          src="/logo.jpg"
          alt="Maternal Care Portal"
          className="w-full h-26 object-contain object-left"
        />
      </div>

      {/* ── MAIN NAVIGATION ───────────────────────────────────────────────── */}
      {/* flex-1 makes this section grow and fill all remaining space */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Main Menu
        </p>
        {mainNavItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

    </aside>
  )
}