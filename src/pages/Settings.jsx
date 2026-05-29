// src/pages/Settings.jsx

import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Settings</h1>
        <p className="mt-1 text-slate-500">
          Configure portal preferences, user access, and system settings.
        </p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16
                      flex flex-col items-center justify-center text-center">
        <div className="bg-slate-100 p-5 rounded-2xl mb-4">
          <Settings size={36} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-600 mb-2">Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          The Settings module is under construction. It will include clinic details,
          user management, notification preferences, and data export options.
        </p>
      </div>
    </div>
  );
}