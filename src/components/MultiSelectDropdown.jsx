import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";

export default function MultiSelectDropdown({ label, options, selected, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setOpen(!open);
          if (!open) setSearchTerm("");
        }}
        className={`w-full px-3 py-2 text-sm border rounded-lg text-left flex justify-between items-center transition bg-white
                   ${disabled ? "bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200" : "border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"}
                   ${open ? "ring-1 ring-indigo-500 border-indigo-500" : ""}`}
      >
        <span className="truncate pr-4">
          {selected.length === 0 ? `Select ${label}...` : `${selected.length} selected`}
        </span>
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg py-1 flex flex-col">
          <div className="px-2 py-2 border-b border-slate-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 text-slate-400" size={14} />
              <input
                type="text"
                autoFocus
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">No options found</div>
            ) : (
              filteredOptions.map(opt => {
                const isSelected = selected.includes(opt.value);
                return (
                  <label key={opt.value} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelected = e.target.checked
                          ? [...selected, opt.value]
                          : selected.filter(x => x !== opt.value);
                        onChange(newSelected);
                      }}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    {opt.label}
                  </label>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
