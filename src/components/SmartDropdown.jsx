import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export default function SmartDropdown({ 
  fieldKey,
  value, 
  onChange, 
  placeholder = "Select or type...",
  disabled = false
}) {
  const [options, setOptions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [query, setQuery] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  // Fetch options once on mount
  useEffect(() => {
    fetch(`/field-options/${fieldKey}`)
      .then(res => res.json())
      .then(data => {
        setOptions(data || []);
      })
      .catch(err => console.error(err));
  }, [fieldKey]);

  // Sync prop value
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Debounced filtering
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!query.trim()) {
        setFiltered(options.slice(0, 5));
      } else {
        const lower = query.toLowerCase();
        const matches = options.filter(o => o.toLowerCase().includes(lower));
        setFiltered(matches.slice(0, 5));
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, options]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        if (isOpen) {
          setIsOpen(false);
          handleCommit(query);
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, isOpen]);

  const handleCommit = (val) => {
    const trimmed = val.trim();
    if (trimmed && !options.includes(trimmed)) {
      // Add to options in backend asynchronously
      fetch(`/field-options/${fieldKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ option: trimmed })
      }).then(() => {
        setOptions(prev => [...prev, trimmed]);
      }).catch(err => console.error(err));
    }
    onChange(trimmed);
  };

  const handleSelect = (val) => {
    setQuery(val);
    setIsOpen(false);
    handleCommit(val);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            onChange(e.target.value); // Sync intermediate state
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              setIsOpen(false);
              handleCommit(query);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-3 pr-10 py-2 text-sm border rounded-xl transition
                     focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent
                     ${disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}
        />
        <div className="absolute right-3 text-slate-400 pointer-events-none">
          <ChevronDown size={14} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </div>
      
      {isOpen && !disabled && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1">
          {filtered.length > 0 ? (
            filtered.map((opt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {opt}
              </button>
            ))
          ) : (
            <div className="px-4 py-2 text-sm text-slate-400">
              {query.trim() ? `Press Enter to save "${query}"` : "No options available"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
