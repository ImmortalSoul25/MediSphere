// src/pages/Communications.jsx

import { MessageSquareText } from "lucide-react";

export default function Communications() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Communications</h1>
        <p className="mt-1 text-slate-500">
          Manage patient messages, templates, and automated communications.
        </p>
      </div>

      <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16
                      flex flex-col items-center justify-center text-center">
        <div className="bg-slate-100 p-5 rounded-2xl mb-4">
          <MessageSquareText size={36} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-semibold text-slate-600 mb-2">Coming Soon</h2>
        <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
          The Communications module is under construction. It will include WhatsApp messaging,
          weekly pregnancy templates, and automated scheduling.
        </p>
      </div>
    </div>
  );
}