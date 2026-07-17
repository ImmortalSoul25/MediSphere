import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Save, AlertCircle, Calendar as CalendarIcon, Trash2 } from "lucide-react";

export default function AddEventPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const defaultDate = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const defaultTime = searchParams.get("time") || "";

  const isEdit = Boolean(id);
  
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [errors, setErrors] = useState({});

  const [form, setForm] = useState({
    title: "",
    type: "Hospital Event",
    description: "",
    startDate: defaultDate,
    endDate: defaultDate,
    startTime: defaultTime,
    endTime: "",
    allDay: false,
    repeat: "Does Not Repeat",
    reminder: "30 Minutes",
    status: "Active",
    customReminderDate: defaultDate,
    customReminderTime: defaultTime,
    customRepeatWeek: "1st",
    customRepeatDay: "Monday"
  });

  useEffect(() => {
    if (isEdit) {
      const fetchEvent = async () => {
        try {
          const res = await fetch(`/calendar-api/${id}`);
          if (res.ok) {
            const data = await res.json();
            setForm(data);
          } else {
            setServerError("Event not found");
          }
        } catch (err) {
          setServerError("Failed to load event");
        } finally {
          setLoading(false);
        }
      };
      fetchEvent();
    }
  }, [id, isEdit]);

  // Handle Birthday and Pregnancy type auto-assignments
  useEffect(() => {
    if (form.type === "Birthday") {
      setForm(prev => ({
        ...prev,
        repeat: "Yearly",
        allDay: true
      }));
    } else if (form.type === "Pregnancy Due Date") {
      setForm(prev => ({
        ...prev,
        repeat: "Does Not Repeat",
        allDay: true
      }));
    }
  }, [form.type]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = "Event Title is required";
    if (!form.type) newErrors.type = "Event Type is required";
    if (!form.startDate) newErrors.startDate = "Start Date is required";
    
    // Logic for Event vs Reminder
    if (form.type !== "Birthday" && form.type !== "Reminder" && form.type !== "Pregnancy Due Date" && !form.allDay) {
      if (!form.endDate) newErrors.endDate = "End Date is required";
      if (!form.startTime) newErrors.startTime = "Start Time is required";
      if (!form.endTime) newErrors.endTime = "End Time is required";
    }

    if (form.type === "Reminder" && !form.allDay) {
      if (!form.startTime) newErrors.startTime = "Time is required";
    }
    
    if (form.reminder === "Custom") {
      if (!form.customReminderDate) newErrors.customReminderDate = "Date is required";
      if (!form.customReminderTime) newErrors.customReminderTime = "Time is required";
    }

    return newErrors;
  };

  const handleSubmit = async () => {
    const vErrors = validate();
    if (Object.keys(vErrors).length > 0) {
      setErrors(vErrors);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setSaving(true);
    setServerError(null);
    
    try {
      const url = isEdit ? `/calendar-api/${id}` : `/calendar-api`;
      const method = isEdit ? "PUT" : "POST";
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      
      if (!res.ok) throw new Error("Failed to save event");
      
      navigate("/calendar");
    } catch (err) {
      setServerError(err.message);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    setSaving(true);
    try {
      await fetch(`/calendar-api/${id}`, { method: "DELETE" });
      navigate("/calendar");
    } catch (err) {
      setServerError("Failed to delete event");
      setSaving(false);
    }
  };

  const inputClass = (hasError) => 
    `w-full px-3 py-2 border rounded-xl text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500
     ${hasError ? "border-rose-300 bg-rose-50 text-slate-800" : "border-slate-200 bg-white text-slate-700"}`;

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading event details...</div>;
  }

  const isReminder = form.type === "Reminder";
  const isBirthday = form.type === "Birthday";
  const isPregnancy = form.type === "Pregnancy Due Date";

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/calendar")} className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={18} className="mr-2" /> Back to Calendar
        </button>
        <h1 className="text-2xl font-bold text-slate-800">
          {isEdit ? "Edit Event" : "Add New Event"}
        </h1>
      </div>

      {serverError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-700 text-sm">
          <AlertCircle size={18} className="mt-0.5" />
          <p>{serverError}</p>
        </div>
      )}

      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          <CalendarIcon size={20} className="text-slate-500" />
          <h2 className="font-semibold text-slate-700">Event Details</h2>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Event Title <span className="text-rose-500">*</span></label>
              <input type="text" name="title" value={form.title} onChange={handleChange} className={inputClass(errors.title)} placeholder="e.g. Monthly Staff Meeting" />
              {errors.title && <p className="text-xs text-rose-500 mt-1">{errors.title}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Event Type <span className="text-rose-500">*</span></label>
              <select name="type" value={form.type} onChange={handleChange} className={inputClass(errors.type)}>
                <option value="Hospital Event">Hospital Event</option>
                <option value="Birthday">Birthday</option>
                <option value="Meeting">Meeting</option>
                <option value="Leave / Holiday">Leave / Holiday</option>
                <option value="Reminder">Reminder</option>
                <option value="School Lecture/ Conference/Talk">School Lecture/ Conference/Talk</option>
                <option value="Pregnancy Due Date">Pregnancy Due Date</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {isEdit && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className={inputClass(false)}>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            )}
            
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="2" className={inputClass(false)} />
            </div>

            {!isBirthday && !isPregnancy && (
              <div className="md:col-span-2 flex items-center gap-2">
                <input type="checkbox" id="allDay" name="allDay" checked={form.allDay} onChange={handleChange} className="w-4 h-4 text-indigo-600 rounded" />
                <label htmlFor="allDay" className="text-sm font-medium text-slate-700">All Day Event</label>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">{form.allDay ? "Date" : "Start Date"} <span className="text-rose-500">*</span></label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} className={inputClass(errors.startDate)} />
              {errors.startDate && <p className="text-xs text-rose-500 mt-1">{errors.startDate}</p>}
            </div>
            
            {!form.allDay && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">{isReminder ? "Time" : "Start Time"} <span className="text-rose-500">*</span></label>
                <input type="time" name="startTime" value={form.startTime} onChange={handleChange} className={inputClass(errors.startTime)} />
                {errors.startTime && <p className="text-xs text-rose-500 mt-1">{errors.startTime}</p>}
              </div>
            )}

            {!isBirthday && !isReminder && !isPregnancy && !form.allDay && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Date <span className="text-rose-500">*</span></label>
                  <input type="date" name="endDate" value={form.endDate} onChange={handleChange} className={inputClass(errors.endDate)} />
                  {errors.endDate && <p className="text-xs text-rose-500 mt-1">{errors.endDate}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">End Time <span className="text-rose-500">*</span></label>
                  <input type="time" name="endTime" value={form.endTime} onChange={handleChange} className={inputClass(errors.endTime)} />
                  {errors.endTime && <p className="text-xs text-rose-500 mt-1">{errors.endTime}</p>}
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Repeat</label>
              <select name="repeat" value={form.repeat} onChange={handleChange} disabled={isBirthday || isPregnancy} className={inputClass(false) + ((isBirthday || isPregnancy) ? " bg-slate-100" : "")}>
                <option value="Does Not Repeat">Does Not Repeat</option>
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Custom Monthly">Custom Monthly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>
            
            {form.repeat === "Custom Monthly" && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Which Week?</label>
                  <select name="customRepeatWeek" value={form.customRepeatWeek} onChange={handleChange} className={inputClass(false)}>
                    <option value="1st">1st</option>
                    <option value="2nd">2nd</option>
                    <option value="3rd">3rd</option>
                    <option value="4th">4th</option>
                    <option value="Last">Last</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Day of Week</label>
                  <select name="customRepeatDay" value={form.customRepeatDay} onChange={handleChange} className={inputClass(false)}>
                    <option value="Sunday">Sunday</option>
                    <option value="Monday">Monday</option>
                    <option value="Tuesday">Tuesday</option>
                    <option value="Wednesday">Wednesday</option>
                    <option value="Thursday">Thursday</option>
                    <option value="Friday">Friday</option>
                    <option value="Saturday">Saturday</option>
                  </select>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Reminder</label>
              <select name="reminder" value={form.reminder} onChange={handleChange} className={inputClass(false)}>
                <option value="None">None</option>
                <option value="15 Minutes">15 Minutes</option>
                <option value="30 Minutes">30 Minutes</option>
                <option value="1 Hour">1 Hour</option>
                <option value="1 Day">1 Day</option>
                <option value="Custom">Custom</option>
              </select>
            </div>

            {form.reminder === "Custom" && (
              <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Custom Date <span className="text-rose-500">*</span></label>
                  <input type="date" name="customReminderDate" value={form.customReminderDate} onChange={handleChange} className={inputClass(errors.customReminderDate)} />
                  {errors.customReminderDate && <p className="text-xs text-rose-500 mt-1">{errors.customReminderDate}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Custom Time <span className="text-rose-500">*</span></label>
                  <input type="time" name="customReminderTime" value={form.customReminderTime} onChange={handleChange} className={inputClass(errors.customReminderTime)} />
                  {errors.customReminderTime && <p className="text-xs text-rose-500 mt-1">{errors.customReminderTime}</p>}
                </div>
              </div>
            )}

          </div>
        </div>
        
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {isEdit && (
              <button onClick={handleDelete} disabled={saving} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors">
                <Trash2 size={16} /> Delete Event
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate("/calendar")} disabled={saving} className="px-5 py-2 text-sm font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={saving} className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-sm transition-colors">
              <Save size={16} /> {saving ? "Saving..." : "Save Event"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
