// src/pages/ImportedRecords.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Stethoscope, Pill, FlaskConical, Syringe, FileText, AlertCircle, RefreshCw } from "lucide-react";
import { useData } from "../context/DataContext";
import { abhaService } from "../services/abhaService";

export default function ImportedRecords() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchPatientDetails } = useData();

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const [p, r, prof] = await Promise.all([
          fetchPatientDetails(id),
          abhaService.getImportedRecords(id),
          abhaService.getProfile(id)
        ]);
        setPatient(p);
        setRecords(r);
        setProfile(prof);
      } catch (e) {
        setError("Failed to load records");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, fetchPatientDetails]);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin text-indigo-600"><RefreshCw size={24} /></div></div>;
  }

  if (error || !patient) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back
        </button>
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center">
          <AlertCircle size={32} className="mb-2" />
          <p className="font-semibold text-lg">{error || "Patient not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Imported Clinical Records</h1>
          <p className="text-slate-500 mt-1">Records synced from Ayushman Bharat Health Account (ABHA)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar: Profile */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Demographics Profile</h2>
            </div>
            <div className="p-5 space-y-3 text-sm">
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Name</span>
                <span className="font-medium text-slate-800">{profile?.name || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Gender</span>
                <span className="font-medium text-slate-800">{profile?.gender || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">DOB</span>
                <span className="font-medium text-slate-800">{profile?.dob || "-"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">Address</span>
                <span className="font-medium text-slate-800 text-right w-40 truncate" title={profile?.address}>{profile?.address || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">State</span>
                <span className="font-medium text-slate-800">{profile?.state || "-"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Records */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Consultations */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600"><Stethoscope size={16} /></div>
              <h2 className="text-base font-bold text-slate-800">Consultations</h2>
              <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{records?.consultations?.length || 0}</span>
            </div>
            <div className="p-5">
              {records?.consultations?.length > 0 ? (
                <div className="space-y-3">
                  {records.consultations.map((c, i) => (
                    <div key={i} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-sm text-slate-800">{c.diagnosis}</span>
                        <span className="text-xs text-slate-500">{c.date}</span>
                      </div>
                      <p className="text-xs text-slate-600 flex gap-2">
                        <span>{c.hospital}</span> • <span>{c.doctor}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No consultations found.</p>
              )}
            </div>
          </section>

          {/* Prescriptions */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <div className="bg-amber-50 p-2 rounded-lg text-amber-500"><Pill size={16} /></div>
              <h2 className="text-base font-bold text-slate-800">Prescriptions</h2>
              <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{records?.prescriptions?.length || 0}</span>
            </div>
            <div className="p-5">
              {records?.prescriptions?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Medicine</th>
                        <th className="px-3 py-2 font-semibold">Dosage</th>
                        <th className="px-3 py-2 font-semibold">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.prescriptions.map((p, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="px-3 py-2 font-medium text-slate-800">{p.medicine}</td>
                          <td className="px-3 py-2 text-slate-600">{p.dosage}</td>
                          <td className="px-3 py-2 text-slate-600">{p.duration}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No prescriptions found.</p>
              )}
            </div>
          </section>

          {/* Lab Reports */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center gap-2">
              <div className="bg-rose-50 p-2 rounded-lg text-rose-500"><FlaskConical size={16} /></div>
              <h2 className="text-base font-bold text-slate-800">Lab Reports</h2>
              <span className="ml-auto bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">{records?.labReports?.length || 0}</span>
            </div>
            <div className="p-5">
              {records?.labReports?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {records.labReports.map((l, i) => (
                    <div key={i} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex justify-between items-center">
                      <span className="font-semibold text-sm text-slate-700">{l.test}</span>
                      <span className="text-sm font-mono bg-white px-2 py-1 rounded border border-slate-200">{l.result}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400 italic">No lab reports found.</p>
              )}
            </div>
          </section>

          {/* Vaccinations & Discharge */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <div className="bg-teal-50 p-2 rounded-lg text-teal-600"><Syringe size={16} /></div>
                <h2 className="text-base font-bold text-slate-800">Vaccinations</h2>
              </div>
              <div className="p-5">
                {records?.vaccinations?.length > 0 ? (
                  <ul className="space-y-2">
                    {records.vaccinations.map((v, i) => (
                      <li key={i} className="text-sm flex justify-between">
                        <span className="text-slate-700 font-medium">{v.vaccine}</span>
                        <span className="text-slate-500 text-xs bg-slate-100 px-1.5 py-0.5 rounded">{v.status}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">None found.</p>
                )}
              </div>
            </section>
            
            <section className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-2">
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><FileText size={16} /></div>
                <h2 className="text-base font-bold text-slate-800">Discharge</h2>
              </div>
              <div className="p-5">
                {records?.dischargeSummaries?.length > 0 ? (
                  <ul className="space-y-2">
                    {records.dischargeSummaries.map((d, i) => (
                      <li key={i} className="text-sm text-slate-700 font-medium">{d}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-slate-400 italic">None found.</p>
                )}
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
}
