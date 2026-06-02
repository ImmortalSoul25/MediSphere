// src/pages/MessageTemplates.jsx

import { useState } from "react";
import { Baby, Stethoscope, CalendarDays } from "lucide-react";
import PregnancyTemplates from "./templates/PregnancyTemplates";

const TABS = [
  { key: "pregnancy",    label: "Pregnancy",        Icon: Baby },
  { key: "other",        label: "Other Conditions", Icon: Stethoscope },
  { key: "appointments", label: "Appointments",     Icon: CalendarDays },
];

function ComingSoon({ label }) {
  return (
    <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16
                    flex flex-col items-center justify-center text-center">
      <p className="text-lg font-semibold text-slate-500 mb-2">{label} Templates</p>
      <p className="text-sm text-slate-400">Coming soon.</p>
    </div>
  );
}

export default function MessageTemplates() {
  const [active, setActive] = useState("pregnancy");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Message Templates</h1>
        <p className="mt-1 text-slate-500">
          Edit the messages sent to patients each week. Changes are saved to{" "}
          <span className="font-mono text-slate-600">message-templates.xlsx</span>.
        </p>
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {TABS.map(({ key, label, Icon }) => (
          <button key={key} onClick={() => setActive(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold
              transition-all duration-150
              ${active === key
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"}`}>
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {active === "pregnancy"    && <PregnancyTemplates />}
      {active === "other"        && <ComingSoon label="Other Conditions" />}
      {active === "appointments" && <ComingSoon label="Appointments" />}
    </div>
  );
}