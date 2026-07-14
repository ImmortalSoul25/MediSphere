// src/pages/SendMessages.jsx
// Renamed from Communications.jsx — same content, updated title

import { useState } from "react";
import { Baby, Stethoscope } from "lucide-react";
import PregnancyComms       from "./communications/PregnancyComms";
import OtherConditionsComms from "./communications/OtherConditionsComms";

const TABS = [
  { key: "pregnancy",    label: "Pregnancy",        Icon: Baby },
  { key: "other",        label: "AMMA", Icon: Stethoscope },
];

export default function SendMessages() {
  const [active, setActive] = useState("pregnancy");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Send Messages</h1>
        <p className="mt-1 text-slate-500">
          Select patients and send weekly messages by category.
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

      {active === "pregnancy"    && <PregnancyComms />}
      {active === "other"        && <OtherConditionsComms />}
    </div>
  );
}
