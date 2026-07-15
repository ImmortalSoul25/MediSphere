// src/pages/queue/Queue.jsx
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Clock, CheckCircle, Plus, MoreVertical, GripVertical, Eye, StickyNote, CheckCircle2, Trash2, X, Ban, RotateCcw } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import AddQueueModal from "./AddQueueModal";
import { useData } from "../../context/DataContext";

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function QueueStatCard({ title, value, Icon, colorClass }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center gap-4">
      <div className={`p-3 rounded-xl ${colorClass}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function getWaitTimeStr(addedAt, endTime = null) {
  if (!addedAt) return "-";
  const end = endTime ? new Date(endTime) : new Date();
  const ms = end - new Date(addedAt);
  if (ms < 0) return "Just now";
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hrs} hr ${remMins} min`;
}

function NotesModal({ notes, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-800">Appointment Notes</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
            {notes || "No appointment notes provided."}
          </p>
        </div>
        <div className="flex justify-end px-6 py-4 border-t border-slate-100">
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

function UnregisteredModal({ onClose, onAdd }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-2">Patient Not Registered</h2>
        <p className="text-sm text-slate-600 mb-6">
          The patient is not registered in the system. Do you want to add them as a new patient?
        </p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Cancel
          </button>
          <button onClick={onAdd} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition">
            Add Patient
          </button>
        </div>
      </div>
    </div>
  );
}

function ConfirmModal({ title, message, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
        <h2 className="text-lg font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 transition">
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Queue() {
  const navigate = useNavigate();
  const { patients } = useData();
  const [modal, setModal] = useState(null);
  const [queue, setQueue] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [now, setNow] = useState(new Date());

  const handleViewPatient = (q) => {
    if (q.patientId && patients && patients.some(p => p.id === q.patientId)) {
      navigate(`/patients/${q.patientId}`);
    } else {
      setModal({ type: 'unregistered' });
    }
  };

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/queue-api/");
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchQueue();
    // Poll every 30s for new queue entries from other clients
    const int = setInterval(fetchQueue, 30000);
    return () => clearInterval(int);
  }, [fetchQueue]);

  useEffect(() => {
    // Update wait time every minute
    const int = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(int);
  }, []);

  const waiting = queue.filter(q => q.status === "Waiting");
  const completed = queue.filter(q => q.status === "Completed");

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(waiting);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Optimistic update
    setQueue([...items, ...completed]);
    
    // Call backend
    try {
      const ids = items.map(i => i.id);
      await fetch("/queue-api/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ids)
      });
      fetchQueue();
    } catch (e) {
      console.error(e);
    }
  };

  const handleComplete = async (id) => {
    try {
      await fetch(`/queue-api/${id}/complete`, { method: "PUT" });
      fetchQueue();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRemove = (id) => {
    setModal({ type: 'delete', id });
  };

  const confirmRemove = async () => {
    const id = modal.id;
    setModal(null);
    try {
      await fetch(`/queue-api/${id}`, { method: "DELETE" });
      fetchQueue();
    } catch (e) {
      console.error(e);
    }
  };

  const handleBringBack = async (id) => {
    try {
      await fetch(`/queue-api/${id}/revert`, { method: "PUT" });
      fetchQueue();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Live Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Manage today's patient queue</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-colors">
          <Plus size={18} /> Add to Queue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QueueStatCard title="Total Waiting" value={waiting.length} Icon={Clock} colorClass="bg-amber-100 text-amber-700" />
        <QueueStatCard title="Today's Total" value={queue.length} Icon={Users} colorClass="bg-blue-100 text-blue-700" />
        <QueueStatCard title="Completed Today" value={completed.length} Icon={CheckCircle} colorClass="bg-emerald-100 text-emerald-700" />
      </div>

      <Section title="Waiting">
        <div className="overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="queue-list">
              {(provided) => (
                <table className="w-full text-left text-sm text-slate-600" {...provided.droppableProps} ref={provided.innerRef}>
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-4 py-3 font-semibold w-12"></th>
                      <th className="px-4 py-3 font-semibold">Sr.</th>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Type</th>
                      <th className="px-4 py-3 font-semibold">Conditions</th>
                      <th className="px-4 py-3 font-semibold">Company</th>
                      <th className="px-4 py-3 font-semibold">Wait Time</th>
                      <th className="px-4 py-3 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waiting.map((q, index) => (
                      <Draggable key={q.id} draggableId={q.id} index={index}>
                        {(provided, snapshot) => (
                          <tr 
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border-b border-slate-50 ${snapshot.isDragging ? "bg-indigo-50 shadow-lg" : "hover:bg-slate-50/50"}`}
                          >
                            <td className="px-4 py-4 text-slate-300" {...provided.dragHandleProps}>
                              <GripVertical size={16} />
                            </td>
                            <td className="px-4 py-4 font-semibold text-slate-700">#{index + 1}</td>
                            <td className="px-4 py-4">
                              <div className="font-semibold text-slate-800">{q.name}</div>
                              <div className="text-xs text-slate-400">{q.contact} {q.patientId && `• ${q.patientId}`}</div>
                            </td>
                            <td className="px-4 py-4">
                              {q.type === "Patient" && <span className="px-2.5 py-1 bg-blue-100 text-blue-700 font-semibold text-[11px] rounded-md">PATIENT</span>}
                              {q.type === "MR" && <span className="px-2.5 py-1 bg-purple-100 text-purple-700 font-semibold text-[11px] rounded-md">MR</span>}
                              {q.type === "Other" && <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-semibold text-[11px] rounded-md">OTHER</span>}
                            </td>
                            <td className="px-4 py-4">
                              {q.type === "Patient" ? (
                                q.conditions && q.conditions.length > 0 ? (
                                  <div className="flex gap-1 flex-wrap">
                                    {q.conditions.map((c, i) => <span key={i} className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">{c}</span>)}
                                  </div>
                                ) : <span className="text-xs text-slate-400">{q.notes || "-"}</span>
                              ) : <span className="text-xs text-slate-400">-</span>}
                            </td>
                            <td className="px-4 py-4">
                              {q.type === "MR" ? (
                                <div className="font-medium text-slate-700">{q.company || "-"}</div>
                              ) : <span className="text-xs text-slate-400">-</span>}
                            </td>
                            <td className="px-4 py-4 font-semibold text-amber-600">{getWaitTimeStr(q.addedAt)}</td>
                            <td className="px-4 py-4">
                              <div className="flex items-center justify-end gap-1">
                                {q.type === "Patient" && (
                                  <button title="View Patient Details" onClick={() => handleViewPatient(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                                    <Eye size={15} />
                                  </button>
                                )}
                                <button title="View Appointment Notes" onClick={() => setModal({ type: 'notes', notes: q.notes })} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition">
                                  <StickyNote size={15} />
                                </button>
                                <button title="Complete" onClick={() => handleComplete(q.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition">
                                  <CheckCircle2 size={15} />
                                </button>
                                <button title="Remove" onClick={() => handleRemove(q.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition">
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {waiting.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-4 py-12 text-center text-slate-500">No one is currently waiting.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </Section>

      {completed.length > 0 && (
        <Section title="Completed Today">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 opacity-70">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold">Sr.</th>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Wait Time</th>
                  <th className="px-4 py-3 font-semibold">Completed At</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {completed.map(q => (
                  <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="px-4 py-3">#{q.sr_no}</td>
                    <td className="px-4 py-3 font-semibold">{q.name}</td>
                    <td className="px-4 py-3">{q.type}</td>
                    <td className="px-4 py-3">{getWaitTimeStr(q.addedAt, q.completedAt)}</td>
                    <td className="px-4 py-3">{new Date(q.completedAt).toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', hour12: true })}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {q.type === "Patient" && (
                          <button title="View Patient Details" onClick={() => handleViewPatient(q)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition">
                            <Eye size={15} />
                          </button>
                        )}
                        <button title="View Appointment Notes" onClick={() => setModal({ type: 'notes', notes: q.notes })} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition">
                          <StickyNote size={15} />
                        </button>
                        <button title="Bring Back to Queue" onClick={() => handleBringBack(q.id)} className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition">
                          <RotateCcw size={15} />
                        </button>
                        <button title="Delete" onClick={() => handleRemove(q.id)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {showAdd && <AddQueueModal onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); fetchQueue(); }} />}
      {modal?.type === "notes" && (
        <NotesModal notes={modal.notes} onClose={() => setModal(null)} />
      )}
      {modal?.type === "unregistered" && (
        <UnregisteredModal 
          onClose={() => setModal(null)} 
          onAdd={() => {
            setModal(null);
            navigate('/patients/add');
          }} 
        />
      )}
      {modal?.type === "delete" && (
        <ConfirmModal
          title="Remove from Queue?"
          message="Are you sure you want to remove this entry? This action cannot be undone."
          onClose={() => setModal(null)}
          onConfirm={confirmRemove}
        />
      )}
    </div>
  );
}
