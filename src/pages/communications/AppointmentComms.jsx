// src/pages/communications/AppointmentComms.jsx
import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
export default function AppointmentComms() {
  
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16
                    flex flex-col items-center justify-center text-center">
      <div className="bg-slate-100 p-5 rounded-2xl mb-4">
        <CalendarDays size={36} className="text-slate-400" />
      </div>
      <h2 className="text-lg font-semibold text-slate-600 mb-2">Coming Soon</h2>
      <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
        Appointment reminders and communications will be available here.
      </p>
    </div>
  );
}