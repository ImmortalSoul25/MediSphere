import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, Phone, Calendar, User, Edit3, Trash2, Plus, Clock, Copy, CheckCircle, Activity, FileText, AlertCircle, Shield } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAppointments } from '../context/AppointmentsContext';
import { PatientForm } from './Patients';
import AppointmentFormModal from '../components/AppointmentFormModal';
import PhotoCapture from '../components/PhotoCapture';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, configConditions, configMedicalHistory, updatePatient, deletePatient, fetchPatientDetails } = useData();
  const { fetchPatientAppointments, addDirectAppointment } = useAppointments();

  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedAppts, setExpandedAppts] = useState({});
  const toggleAppt = (idx) => setExpandedAppts(prev => ({ ...prev, [idx]: !prev[idx] }));
  
  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddAppointmentOpen, setIsAddAppointmentOpen] = useState(false);
  const [isChangePhotoOpen, setIsChangePhotoOpen] = useState(false);
  
  const handlePhotoUpdate = async (file) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      await fetch(`/patient/${id}/photo`, {
        method: "POST",
        body: formData,
      });
      setIsChangePhotoOpen(false);
      // force reload image by updating a key or refetching
      setPatient({...patient});
    } catch(e) {
      console.error(e);
      alert("Failed to upload photo");
    }
  };

  const handlePhotoRemove = async () => {
    if(!window.confirm("Are you sure you want to remove the profile photo?")) return;
    try {
      await fetch(`/patient/${id}/photo`, { method: "DELETE" });
      setPatient({...patient});
    } catch(e) {
      console.error(e);
      alert("Failed to remove photo");
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      
      // Always fetch full details because the list only has metadata
      let p;
      try {
        p = await fetchPatientDetails(id);
      } catch (e) {
        console.error(e);
      }
      setPatient(p);

      // Get appointments
      if (p) {
        try {
          const appts = await fetchPatientAppointments(id);
          setAppointments(appts || []);
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
    loadData();
  }, [id, patients, fetchPatientDetails, fetchPatientAppointments]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this patient? This action cannot be undone.")) {
      await deletePatient(id);
      navigate('/patients');
    }
  };

  function safeDate(d) {
    if (!d) return null;
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? null : dt;
  }

  function fmtDateLocal(dateObj) {
    if (!dateObj) return 'N/A';
    const d = String(dateObj.getDate()).padStart(2, '0');
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const y = dateObj.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const calcAge = (dob) => {
    const d = safeDate(dob);
    if (!d) return null;
    return Math.floor((Date.now() - d.getTime()) / 31557600000);
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin text-indigo-600"><Activity size={24} /></div></div>;
  }

  if (!patient) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back to Patients
        </button>
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center">
          <AlertCircle size={32} className="mb-2" />
          <p className="font-semibold text-lg">Patient not found</p>
        </div>
      </div>
    );
  }

  const { metadata } = patient;
  const age = calcAge(metadata.date_of_birth);

  const hasPregnancy = (metadata.conditions || []).some(code => {
    const cond = (configConditions || []).find(c => c.code === code);
    return cond && cond.name.toLowerCase().includes("pregnancy");
  });

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{metadata.name}</h1>
            <div className="flex items-center text-sm text-slate-500 mt-1 gap-2">
              <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">#{metadata.id}</span>
              <button 
                onClick={() => navigator.clipboard.writeText(metadata.id)}
                className="hover:text-indigo-600"
                title="Copy ID"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => navigate(`/patients/${metadata.id}/abha`)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors font-semibold"
          >
            <Shield size={16} /> <span className="hidden sm:inline">ABHA</span>
          </button>
          <button 
            onClick={() => navigate(`/patients/${metadata.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-semibold"
          >
            <Edit3 size={16} /> <span className="hidden sm:inline">Edit</span>
          </button>
          <button 
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
          >
            <Trash2 size={16} /> <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel: Patient Info */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Profile Photo Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center">
            <div className="relative group">
              <img 
                src={`/patient/${id}/photo?t=${Date.now()}`}
                alt={metadata.name} 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-slate-100 transition-transform duration-300 group-hover:scale-105"
                onError={(e) => { e.target.src = "/patient/default/photo"; }}
              />
            </div>
            <div className="mt-4 flex gap-2 w-full">
              <button 
                onClick={() => setIsChangePhotoOpen(true)}
                className="flex-1 py-1.5 px-3 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                Change Photo
              </button>
              <button 
                onClick={handlePhotoRemove}
                className="py-1.5 px-3 text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 rounded-lg hover:bg-rose-100 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <User size={18} className="text-indigo-500" /> Patient Details
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Phone size={14} /> Primary Phone</span>
                <span className="font-medium text-slate-800">{metadata.contact}</span>
              </div>
              {metadata.altContact && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Phone size={14} /> Alt. Phone</span>
                  <span className="font-medium text-slate-800">{metadata.altContact}</span>
                </div>
              )}

              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar size={14} /> Date of Birth</span>
                <span className="font-medium text-slate-800">
                  {safeDate(metadata.date_of_birth) ? fmtDateLocal(safeDate(metadata.date_of_birth)) : 'N/A'} {age ? `(${age} yrs)` : ''}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Gender</span>
                <span className="font-medium text-slate-800">{metadata.gender || 'N/A'}</span>
              </div>
              

            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Other Details</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Marital Status</span>
                <span className="font-medium text-slate-800">{metadata.marital_status || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Education</span>
                <span className="font-medium text-slate-800">{metadata.education || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Profession</span>
                <span className="font-medium text-slate-800">{metadata.profession || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Referred By</span>
                <span className="font-medium text-slate-800">{metadata.referred_by || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Address</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex flex-col pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 mb-1">Line 1</span>
                <span className="font-medium text-slate-800 break-words">{metadata.address_line_1 || 'N/A'}</span>
              </div>
              {metadata.address_line_2 && (
                <div className="flex flex-col pb-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500 mb-1">Line 2</span>
                  <span className="font-medium text-slate-800 break-words">{metadata.address_line_2}</span>
                </div>
              )}
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Locality</span>
                <span className="font-medium text-slate-800">{metadata.locality || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">City</span>
                <span className="font-medium text-slate-800">{metadata.city || 'N/A'}</span>
              </div>
            </div>
          </div>
              
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Medical Setup</h2>
            </div>
            <div className="p-5 space-y-4">
              {hasPregnancy && (
                <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                  <span className="text-sm text-slate-500 flex items-center gap-2"><Calendar size={14} /> Expected Due</span>
                  <span className="font-medium text-slate-800">
                    {safeDate(patient.metadata?.expected_due_date) ? fmtDateLocal(safeDate(patient.metadata?.expected_due_date)) : 'Not Set'}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500 flex items-center gap-2"><CheckCircle size={14} /> Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  (metadata.is_active === true || metadata.is_active === "true") ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {(metadata.is_active === true || metadata.is_active === "true") ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="pt-2">
                <span className="block text-sm text-slate-500 mb-2">Conditions</span>
                {Array.isArray(metadata.conditions) && metadata.conditions.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {metadata.conditions.map((c, i) => {
                      const cond = (configConditions || []).find(item => item.code === c);
                      return (
                        <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium border border-indigo-100">
                          {cond ? cond.name : c}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">None recorded</span>
                )}
              </div>

              <div className="pt-2">
                <span className="block text-sm text-slate-500 mb-2">Medical History</span>
                {Array.isArray(metadata.medical_history) && metadata.medical_history.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {metadata.medical_history.map((m, i) => {
                      const mh = (configMedicalHistory || []).find(item => item.code === m);
                      return (
                        <span key={i} className="px-2 py-1 bg-amber-50 text-amber-700 rounded-md text-xs font-medium border border-amber-100">
                          {mh ? mh.name : m}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="text-sm text-slate-400 italic">None recorded</span>
                )}
              </div>
            </div>
          </div>

          {(patient.notes || metadata.last_visit) && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FileText size={18} className="text-blue-500" /> Notes & History
                </h2>
              </div>
              <div className="p-5 space-y-4">
                {metadata.last_visit && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Last Visit</span>
                    <p className="text-sm text-slate-800">{safeDate(metadata.last_visit) ? fmtDateLocal(safeDate(metadata.last_visit)) : 'N/A'}</p>
                  </div>
                )}
                {patient.notes && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Notes</span>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100">{patient.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-6">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Shield size={18} className="text-blue-500" /> ABHA Linkage
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Status</span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                  metadata.abhaStatus === 'Linked' || metadata.abhaStatus === 'Synced' ? 'bg-green-100 text-green-700' : 
                  metadata.abhaStatus === 'Consent Pending' ? 'bg-amber-100 text-amber-700' : 
                  'bg-slate-100 text-slate-600'
                }`}>
                  {metadata.abhaStatus || "Not Linked"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Last Sync</span>
                <span className="font-medium text-slate-800">
                  {metadata.lastSync ? fmtDateLocal(new Date(metadata.lastSync)) : 'Never'}
                </span>
              </div>
              <button 
                onClick={() => navigate(`/patients/${metadata.id}/abha`)}
                className="w-full text-center py-2 text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Manage ABHA Integration →
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel: Appointments */}
        <div className="lg:col-span-1 h-full max-h-[800px]">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-emerald-500" /> Appointment History
                <span className="bg-slate-200 text-slate-700 text-xs py-0.5 px-2 rounded-full ml-2">
                  {appointments.length}
                </span>
              </h2>
              <button 
                onClick={() => setIsAddAppointmentOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus size={14} /> Book
              </button>
            </div>
            
            <div className="p-5 flex-1 overflow-y-auto">
              {appointments.length === 0 ? (
                <div className="text-center py-12">
                  <div className="bg-slate-50 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-4">
                    <Calendar size={24} className="text-slate-400" />
                  </div>
                  <h3 className="text-slate-700 font-medium mb-1">No Appointments</h3>
                  <p className="text-slate-500 text-sm">This patient hasn't had any appointments yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {appointments
                    .sort((a, b) => (safeDate(b.appointmentDate)?.getTime() || 0) - (safeDate(a.appointmentDate)?.getTime() || 0))
                    .map((appt, idx) => {
                      const isPast = safeDate(appt.appointmentDate) && safeDate(appt.appointmentDate) < new Date(new Date().setHours(0,0,0,0));
                      return (
                        <div key={appt.appointmentId || idx} className={`p-4 rounded-xl border transition-all duration-300 ${isPast ? 'bg-slate-50 border-slate-100' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${isPast ? 'bg-slate-200 text-slate-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                <Calendar size={18} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-800 text-sm">
                                  {safeDate(appt.appointmentDate) ? fmtDateLocal(safeDate(appt.appointmentDate)) : 'Invalid Date'}
                                </h4>
                                <div className="flex items-center text-xs font-medium text-slate-500 mt-0.5">
                                  <Clock size={12} className="mr-1" /> {appt.appointmentTime || 'N/A'}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                                isPast ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                              }`}>
                                {isPast ? 'Completed' : 'Scheduled'}
                              </span>
                              <button onClick={() => toggleAppt(idx)} className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                {expandedAppts[idx] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </div>
                          </div>
                          
                          <div className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${expandedAppts[idx] ? 'grid-rows-[1fr] mt-3' : 'grid-rows-[0fr] mt-0'}`}>
                            <div className="overflow-hidden">
                              <div className="bg-white p-3 rounded-lg border border-slate-100 text-sm">
                                <div className="flex mb-2">
                                  <span className="w-20 text-slate-500 font-medium">Type:</span>
                                  <span className="text-slate-800 font-medium">{appt.appointmentType || 'Regular'}</span>
                                </div>
                                {appt.wait_time_minutes !== undefined && appt.wait_time_minutes !== null && (
                                  <div className="flex mb-2">
                                    <span className="w-20 text-slate-500 font-medium">Wait Time:</span>
                                    <span className="text-amber-600 font-medium">{appt.wait_time_minutes} min</span>
                                  </div>
                                )}
                                {appt.visit_time_minutes !== undefined && appt.visit_time_minutes !== null && (
                                  <div className="flex mb-2">
                                    <span className="w-20 text-slate-500 font-medium">Visit Time:</span>
                                    <span className="text-pink-600 font-medium">{appt.visit_time_minutes} min</span>
                                  </div>
                                )}
                                {appt.concern && (
                                  <div className="flex mb-2">
                                    <span className="w-20 text-slate-500 font-medium">Concern:</span>
                                    <span className="text-slate-800">{appt.concern}</span>
                                  </div>
                                )}
                                {appt.notes && (
                                  <div className="flex">
                                    <span className="w-20 text-slate-500 font-medium">Notes:</span>
                                    <span className="text-slate-800 italic">{appt.notes}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isChangePhotoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <PhotoCapture 
              currentPhotoUrl={`/patient/${id}/photo`}
              onPhotoSelected={(file) => handlePhotoUpdate(file)}
              onCancel={() => setIsChangePhotoOpen(false)}
            />
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <PatientForm 
          title="Edit Patient"
          initial={{
            id: metadata.id,
            name: metadata.name,
            date_of_birth: metadata.date_of_birth,
            contact: metadata.contact,
            altContact: metadata.altContact || "",
            gender: metadata.gender || "",
            conditions: metadata.conditions || [],
            medical_history: metadata.medical_history || [],
            is_active: String(metadata.is_active),
            receive_msgs: String(metadata.receive_msgs !== false),
            last_visit: metadata.last_visit || "",
            notes: patient.notes || ""
          }}
          isEdit={true}
          patients={patients}
          onSave={async (data) => {
             await updatePatient(data);
             setIsEditModalOpen(false);
             fetchPatientDetails(id).then(setPatient);
          }}
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}

      {isAddAppointmentOpen && (
        <AppointmentFormModal 
          onClose={() => setIsAddAppointmentOpen(false)}
          onConfirm={async (data) => {
            await addDirectAppointment({
              patientId: metadata.id,
              patientName: metadata.name,
              contact: metadata.contact,
              age: age,
              ...data
            });
            // refresh history
            const appts = await fetchPatientAppointments(id);
            setAppointments(appts || []);
            setIsAddAppointmentOpen(false);
          }}
          fixedPatient={{
            id: metadata.id,
            name: metadata.name,
            contact: metadata.contact,
            date_of_birth: metadata.date_of_birth,
          }}
        />
      )}
    </div>
  );
}
