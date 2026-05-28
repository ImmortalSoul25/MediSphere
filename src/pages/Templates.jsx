// src/pages/Templates.jsx
//
// Template editor — data lives in DataContext (backed by Excel).
// Saving a template writes the change back to the Excel file automatically.

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Save, RotateCcw, BookOpen } from "lucide-react";
import { useData } from "../context/DataContext";

export default function Templates() {
  const { templates, updateTemplate } = useData();

  const [selectedWeek,  setSelectedWeek]  = useState(null);
  const [draftMessage,  setDraftMessage]  = useState("");
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const [searchText,    setSearchText]    = useState("");
  const [isDirty,       setIsDirty]       = useState(false);
  const [saved,         setSaved]         = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!templates) return <p className="text-slate-400 text-sm">Loading templates…</p>;

  const filteredWeeks = templates.filter((t) =>
    `week ${t.week}`.includes(searchText.toLowerCase()) ||
    String(t.week).startsWith(searchText.trim())
  );

  const handleSelectWeek = (week) => {
    const template = templates.find((t) => t.week === week);
    setSelectedWeek(week);
    setDraftMessage(template.message);
    setIsDirty(false);
    setSaved(false);
    setDropdownOpen(false);
    setSearchText("");
  };

  const handleMessageChange = (e) => {
    setDraftMessage(e.target.value);
    setIsDirty(true);
    setSaved(false);
  };

  // Save: calls context which updates state + writes Excel
  const handleSave = () => {
    updateTemplate(selectedWeek, draftMessage);
    setIsDirty(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // Reset: reverts to the current saved value from context
  const handleReset = () => {
    const current = templates.find((t) => t.week === selectedWeek);
    setDraftMessage(current.message);
    setIsDirty(false);
  };

  const triggerLabel = selectedWeek ? `Week ${selectedWeek}` : "Select a week…";

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Templates</h1>
        <p className="mt-1 text-slate-500">
          View and edit the weekly WhatsApp message templates. Changes are saved to your Excel file automatically.
        </p>
      </div>

      {/* Editor card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-2xl">

        {/* Week dropdown */}
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
          Pregnancy Week
        </label>

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2.5
                       border border-slate-200 rounded-xl bg-white text-sm
                       text-slate-700 shadow-sm hover:border-teal-400
                       focus:outline-none focus:ring-2 focus:ring-teal-400 transition"
          >
            <span className={selectedWeek ? "text-slate-800 font-medium" : "text-slate-400"}>
              {triggerLabel}
            </span>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200
                            rounded-xl shadow-lg overflow-hidden">
              <div className="p-2 border-b border-slate-100">
                <input
                  type="number"
                  min="1"
                  max="40"
                  autoFocus
                  placeholder="Type a week number (1–40)…"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                             focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
                />
              </div>
              <ul className="max-h-52 overflow-y-auto">
                {filteredWeeks.length > 0 ? (
                  filteredWeeks.map((t) => (
                    <li key={t.week}>
                      <button
                        type="button"
                        onClick={() => handleSelectWeek(t.week)}
                        className={`w-full text-left px-4 py-2.5 text-sm hover:bg-teal-50 hover:text-teal-700 transition-colors
                          ${selectedWeek === t.week ? "bg-teal-50 text-teal-700 font-semibold" : "text-slate-700"}`}
                      >
                        Week {t.week}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="px-4 py-3 text-sm text-slate-400">
                    No week found for "{searchText}".
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* Message editor */}
        {selectedWeek !== null ? (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                <BookOpen size={14} className="text-teal-600" />
                Message for Week {selectedWeek}
              </label>
              <span className="text-xs text-slate-400">{draftMessage.length} chars</span>
            </div>

            <textarea
              value={draftMessage}
              onChange={handleMessageChange}
              rows={7}
              className="w-full px-4 py-3 text-sm border border-slate-200 rounded-xl
                         bg-slate-50 text-slate-700 leading-relaxed resize-y
                         focus:outline-none focus:ring-2 focus:ring-teal-400
                         focus:border-transparent focus:bg-white transition"
            />

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150
                  ${isDirty
                    ? "bg-teal-600 hover:bg-teal-700 text-white shadow-sm"
                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                  }`}
              >
                <Save size={15} />
                Save
              </button>

              <button
                onClick={handleReset}
                disabled={!isDirty}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 border
                  ${isDirty
                    ? "border-slate-200 text-slate-600 hover:bg-slate-50"
                    : "border-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
              >
                <RotateCcw size={15} />
                Reset
              </button>

              {saved && (
                <span className="text-sm text-teal-600 font-medium animate-pulse">
                  ✓ Saved to Excel!
                </span>
              )}
            </div>

            {isDirty && (
              <p className="mt-2 text-xs text-amber-500">You have unsaved changes.</p>
            )}
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center justify-center py-12 text-center
                          border-2 border-dashed border-slate-200 rounded-xl">
            <BookOpen size={32} className="text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">
              Select a pregnancy week above to view and edit its template.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}