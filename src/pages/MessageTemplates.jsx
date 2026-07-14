import { useEffect, useMemo, useState } from "react";
import { Baby, Stethoscope, CalendarDays, Save, X } from "lucide-react";
import PregnancyTemplates from "./templates/PregnancyTemplates";

import AppointmentTemplates from "./templates/AppointmentTemplates";

const TABS = [
  { key: "pregnancy", label: "Pregnancy", Icon: Baby },
  { key: "other", label: "AMMA", Icon: Stethoscope },
  { key: "appointments", label: "Appointments", Icon: CalendarDays },
];

function ComingSoon({ label }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
      <p className="text-lg font-semibold text-slate-500 mb-2">{label} Templates</p>
      <p className="text-sm text-slate-400">Coming soon.</p>
    </div>
  );
}



import { useLocation } from "react-router-dom";

export default function MessageTemplates() {
  const { state } = useLocation();
  const [active, setActive] = useState(state?.tab || "pregnancy");

  useEffect(() => {
    if (state?.scroll) {
      window.scrollTo(0, state.scroll);
    }
  }, [state]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Message Templates</h1>
        <p className="mt-1 text-slate-500">Edit the messages sent to patients.</p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map(({ key, label, Icon }) => <button key={key} onClick={() => setActive(key)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-150 ${active === key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Icon size={15} />{label}</button>)}
      </div>

      {active === "pregnancy" && <PregnancyTemplates />}
      {active === "other" && <ComingSoon label="AMMA" />}
      {active === "appointments" && <AppointmentTemplates />}
    </div>
  );
}
