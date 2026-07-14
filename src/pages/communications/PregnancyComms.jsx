// src/pages/communications/PregnancyComms.jsx
//
// Shows all active Pregnancy patients.
// Lets you select one / many / all and "send" weekly WhatsApp messages.
// Send flow: idle → sending (pause / stop controls) → done.

import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect, useRef } from "react";
import {
  Send, Pause, Play, Square, CheckCircle2, X,
  ArrowUpDown, ArrowUp, ArrowDown, Eye, Loader2,
} from "lucide-react";
import { useData } from "../../context/DataContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(str) {
  if (!str || str === "") return "—";
  const [y, m, d] = str.split("-");
  if (!y || !m || !d) return str;
  return `${d}/${m}/${y}`;
}

function calcCurrentWeek(dueDateStr) {
  if (!dueDateStr || dueDateStr === "") return null;
  const due   = new Date(dueDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysRemaining  = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  const weeksRemaining = Math.round(daysRemaining / 7);
  const week           = 40 - weeksRemaining;
  if (week < 1)  return "< 1";
  if (week > 40) return "> 40";
  return week;
}

// ─── Sort button ──────────────────────────────────────────────────────────────
function SortButton({ sortKey, currentKey, sortDir, label, onClick }) {
  const active = currentKey === sortKey;
  return (
    <button onClick={() => onClick(sortKey)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
        border transition whitespace-nowrap
        ${active
          ? "bg-teal-600 text-white border-teal-600"
          : "bg-white text-slate-600 border-slate-200 hover:border-teal-300 hover:text-teal-700"}`}>
      {active
        ? sortDir === "asc" ? <ArrowUp size={11} /> : <ArrowDown size={11} />
        : <ArrowUpDown size={11} className="text-slate-400" />}
      {label}
    </button>
  );
}

// ─── Week badge ───────────────────────────────────────────────────────────────
function WeekBadge({ week }) {
  if (week === null) return <span className="text-slate-400 text-xs">—</span>;
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs
                     font-semibold bg-teal-50 text-teal-700">
      Wk {week}
    </span>
  );
}

// ─── Send status badge for "This Week Sent" ───────────────────────────────────
function SentBadge({ sent }) {
  if (sent === true)
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs
                       font-semibold bg-green-100 text-green-700">
        <CheckCircle2 size={11} /> Sent
      </span>
    );
  if (sent === "failed")
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs
                       font-semibold bg-rose-100 text-rose-600">
        <X size={11} /> Failed
      </span>
    );
  return <span className="text-slate-300 text-xs font-mono">—</span>;
}

// ─── View Details mini-modal ──────────────────────────────────────────────────
function ViewModal({ patient, onClose }) {
  const week = calcCurrentWeek(patient.expected_due_date);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <p className="font-bold text-slate-800">{patient.name}</p>
            <p className="text-xs text-slate-400 font-mono">ID: {patient.id}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-2.5 text-sm">
          {[
            ["Contact",       patient.contact],
            ["Due Date",      fmtDate(patient.expected_due_date)],
            ["Current Week",  week !== null ? `Week ${week}` : "—"],
            ["Last Wk Sent",  patient.lastWeekSent && patient.lastWeekSent !== "N/A" ? `Week ${patient.lastWeekSent}` : "—"],
            ["Diagnosis",     patient.diagnosis || "—"],
            ["Remarks",       patient.remarks   || "—"],
          ].map(([lbl, val]) => (
            <div key={lbl} className="flex gap-3">
              <span className="text-xs font-semibold text-slate-400 w-28 flex-shrink-0 pt-0.5">{lbl}</span>
              <span className="text-slate-700 text-xs leading-relaxed">{val}</span>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 border border-slate-200
                       rounded-xl hover:bg-slate-50 transition">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Send progress bar ────────────────────────────────────────────────────────
function SendProgressBar({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return (
    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
      <div
        className="h-2 rounded-full bg-teal-500 transition-all duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function PregnancyComms() {
  const navigate = useNavigate();
  const { patients, configConditions } = useData();

  const pregnancyPatients = useMemo(() => {
    return (patients || []).filter((p) => {
      if (p.is_active === false || p.is_active === "false" || p.receive_msgs === false || p.receive_msgs === "false") return false;
      return (p.conditions || []).some(code => {
        const cond = (configConditions || []).find(c => c.code === code);
        return cond && cond.name.toLowerCase().includes("pregnancy");
      });
    });
  }, [patients, configConditions]);

  // ── Sort ────────────────────────────────────────────────────────────────────
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const sorted = useMemo(() => {
    return [...pregnancyPatients].sort((a, b) => {
      let av, bv;
      if (sortKey === "name")    { av = a.name.toLowerCase();    bv = b.name.toLowerCase(); }
      if (sortKey === "id")      { av = parseInt(a.id, 10) || 0; bv = parseInt(b.id, 10) || 0; }
      if (sortKey === "expected_due_date") {
        av = a.expected_due_date ? new Date(a.expected_due_date) : new Date(0);
        bv = b.expected_due_date ? new Date(b.expected_due_date) : new Date(0);
        return sortDir === "asc" ? av - bv : bv - av;
      }
      if (sortKey === "week") {
        av = calcCurrentWeek(a.expected_due_date) ?? -1;
        bv = calcCurrentWeek(b.expected_due_date) ?? -1;
      }
      if (av < bv) return sortDir === "asc" ? -1 :  1;
      if (av > bv) return sortDir === "asc" ?  1 : -1;
      return 0;
    });
  }, [pregnancyPatients, sortKey, sortDir]);

  // ── Selection ───────────────────────────────────────────────────────────────
  const [selected, setSelected] = useState(new Set());

  // Keep selection valid if patient list changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected((prev) => {
      const validIds = new Set(sorted.map((p) => p.id));
      const next     = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [sorted]);

  const allSelected  = sorted.length > 0 && selected.size === sorted.length;
  const someSelected = selected.size > 0 && !allSelected;

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else             setSelected(new Set(sorted.map((p) => p.id)));
  };

  const toggleOne = (id) => {
     
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else              next.add(id);
      return next;
    });
  };

  // ── Sending state ───────────────────────────────────────────────────────────
  // "idle" | "sending" | "paused" | "done"
  const [sendState, setSendState] = useState("idle");
  const [progress,  setProgress]  = useState({ done: 0, total: 0 });
  // Map patientId → true | "failed"
  const [sentMap,   setSentMap]   = useState({});

  const pausedRef    = useRef(false);
  const stoppedRef   = useRef(false);
  const intervalRef  = useRef(null);

  // ── View modal ──────────────────────────────────────────────────────────────
  const [viewPatient, setViewPatient] = useState(null);

  // ── Send logic (simulated) ──────────────────────────────────────────────────
  const startSending = async () => {
    const ids    = [...selected];
    const total  = ids.length;

    setSendState("sending");
    setProgress({ done: 0, total });
    setSentMap({});
    pausedRef.current  = false;
    stoppedRef.current = false;

    if (total === 0) {
      setSendState("done");
      return;
    }

    try {
      const res = await fetch("/whatsapp/send-pregnancy-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_ids: ids })
      });
      const data = await res.json();
      const results = data.results || {};
      
      const newMap = {};
      for (const id of ids) {
        newMap[id] = results[id] === "Sent" ? true : "failed";
      }
      setSentMap(newMap);
      setProgress({ done: total, total });
    } catch (e) {
      console.error("Error sending messages:", e);
      const newMap = {};
      for (const id of ids) {
        newMap[id] = "failed";
      }
      setSentMap(newMap);
      setProgress({ done: total, total });
    }

    setSendState("done");
  };

  const handlePause = () => {
    pausedRef.current = !pausedRef.current;
    setSendState(pausedRef.current ? "paused" : "sending");
  };

  const handleStop = () => {
    stoppedRef.current = true;
    clearTimeout(intervalRef.current);
    setSendState("idle");
    setProgress({ done: 0, total: 0 });
    setSentMap({});
  };

  const handleDone = () => {
    setSendState("idle");
    setProgress({ done: 0, total: 0 });
    setSentMap({});
    setSelected(new Set());
  };

  useEffect(() => () => clearTimeout(intervalRef.current), []);

  const isSending = sendState === "sending" || sendState === "paused";
  const isDone    = sendState === "done";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 mb-4">

        {/* Select all */}
        <button
          onClick={toggleAll}
          disabled={isSending || sorted.length === 0}
          className={`px-3 py-2 text-xs font-semibold rounded-xl border transition
            ${allSelected
              ? "bg-teal-600 text-white border-teal-600"
              : "bg-white text-slate-600 border-slate-200 hover:border-teal-300"}
            disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {allSelected ? "Deselect All" : "Select All"}
        </button>

        {/* Selection count */}
        <span className="text-sm text-slate-500 font-medium">
          <span className="font-bold text-slate-800">{selected.size}</span>
          {" "}of{" "}
          <span className="font-bold text-slate-800">{sorted.length}</span>
          {" "}selected
        </span>

        {/* Sort */}
        <div className="flex items-center gap-1.5 ml-auto flex-wrap">
          <span className="text-xs text-slate-400 font-semibold flex items-center gap-1">
            <ArrowUpDown size={11} /> Sort:
          </span>
          <SortButton sortKey="name"    currentKey={sortKey} sortDir={sortDir} label="Name"     onClick={handleSort} />
          <SortButton sortKey="id"      currentKey={sortKey} sortDir={sortDir} label="ID"        onClick={handleSort} />
          <SortButton sortKey="expected_due_date" currentKey={sortKey} sortDir={sortDir} label="Due Date"  onClick={handleSort} />
          <SortButton sortKey="week"    currentKey={sortKey} sortDir={sortDir} label="Curr Week" onClick={handleSort} />
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => { if (el) el.indeterminate = someSelected; }}
                    onChange={toggleAll}
                    disabled={isSending || sorted.length === 0}
                    className="accent-teal-600 w-4 h-4 rounded cursor-pointer disabled:opacity-40"
                  />
                </th>
                <th className="px-4 py-3 font-semibold">Patient ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact</th>
                <th className="px-4 py-3 font-semibold">Due Date</th>
                <th className="px-4 py-3 font-semibold">Curr Week</th>
                <th className="px-4 py-3 font-semibold">Last Wk Sent</th>
                <th className="px-4 py-3 font-semibold">This Wk Sent</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.length > 0 ? (
                sorted.map((p) => {
                  const isSelected = selected.has(p.id);
                  const week       = calcCurrentWeek(p.expected_due_date);
                  const sentStatus = sentMap[p.id] ?? null;
                  const isSendingThis = isSending && selected.has(p.id) && sentStatus === null;

                  return (
                    <tr key={p.id}
                      onClick={() => !isSending && toggleOne(p.id)}
                      className={`transition-colors duration-100 cursor-pointer
                        ${isSelected
                          ? "bg-teal-50/60 hover:bg-teal-50"
                          : "hover:bg-slate-50"}`}>

                      {/* Checkbox */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(p.id)}
                          disabled={isSending}
                          className="accent-teal-600 w-4 h-4 rounded cursor-pointer disabled:opacity-40"
                        />
                      </td>

                      <td className="px-4 py-3.5 font-mono text-slate-500 text-xs">{p.id}</td>
                      <td className="px-4 py-3.5 font-medium text-slate-800">{p.name}</td>
                      <td className="px-4 py-3.5 text-slate-600">{p.contact}</td>
                      <td className="px-4 py-3.5 text-slate-600">{fmtDate(p.expected_due_date)}</td>
                      <td className="px-4 py-3.5"><WeekBadge week={week} /></td>
                      <td className="px-4 py-3.5 text-slate-500 text-xs">
                        {p.lastWeekSent && p.lastWeekSent !== "N/A"
                          ? `Week ${p.lastWeekSent}`
                          : <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-4 py-3.5">
                        {isSendingThis
                          ? <Loader2 size={14} className="animate-spin text-teal-500" />
                          : <SentBadge sent={sentStatus} />}
                      </td>

                      {/* View details */}
                      <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => navigate('/patients/' + p.id)}
                          className="flex items-center gap-1.5 text-xs font-semibold
                                     text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5
                                     rounded-lg transition-colors">
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-5 py-14 text-center text-slate-400 text-sm">
                    No active pregnancy patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50 text-xs text-slate-400">
          {sorted.length} active pregnancy {sorted.length === 1 ? "patient" : "patients"}
        </div>
      </div>

      {/* ── Send panel ──────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-5 py-4">

        {/* Idle state */}
        {sendState === "idle" && (
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-700">Send Weekly Messages</p>
              <p className="text-xs text-slate-400 mt-0.5">
                {selected.size > 0
                  ? `Ready to send to ${selected.size} selected patient${selected.size > 1 ? "s" : ""}.`
                  : "Select patients above to enable sending."}
              </p>
            </div>
            <button
              onClick={startSending}
              disabled={selected.size === 0}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                shadow-sm transition-all duration-150
                ${selected.size > 0
                  ? "bg-teal-600 hover:bg-teal-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
            >
              <Send size={15} />
              Send Messages
            </button>
          </div>
        )}

        {/* Sending / paused state */}
        {isSending && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  {sendState === "paused" ? "Sending Paused" : "Sending Messages…"}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {progress.done} of {progress.total} messages sent
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Pause / Resume */}
                <button
                  onClick={handlePause}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                    transition shadow-sm
                    ${sendState === "paused"
                      ? "bg-teal-600 hover:bg-teal-700 text-white"
                      : "bg-amber-400 hover:bg-amber-500 text-white"}`}
                >
                  {sendState === "paused"
                    ? <><Play size={14} /> Resume</>
                    : <><Pause size={14} /> Pause</>}
                </button>
                {/* Stop */}
                <button
                  onClick={handleStop}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                             bg-rose-500 hover:bg-rose-600 text-white transition shadow-sm"
                >
                  <Square size={14} /> Stop
                </button>
              </div>
            </div>
            <SendProgressBar done={progress.done} total={progress.total} />
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse inline-block" />
              {sendState === "paused" ? "Paused — click Resume to continue" : "Sending in progress…"}
            </div>
          </div>
        )}

        {/* Done state */}
        {isDone && (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-50 p-2.5 rounded-xl">
                <CheckCircle2 size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">All done!</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {Object.values(sentMap).filter((v) => v === true).length} sent ·{" "}
                  {Object.values(sentMap).filter((v) => v === "failed").length} failed
                </p>
              </div>
            </div>
            <button
              onClick={handleDone}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                         bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <X size={14} /> Dismiss
            </button>
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {viewPatient && (
        <ViewModal patient={viewPatient} onClose={() => setViewPatient(null)} />
      )}
    </div>
  );
}