// src/pages/AbhaManagement.jsx

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Shield, ShieldCheck, Activity, CheckCircle, FileText, DownloadCloud, AlertCircle, RefreshCw } from "lucide-react";
import { useData } from "../context/DataContext";
import { abhaService } from "../services/abhaService";

export default function AbhaManagement() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { fetchPatientDetails, updatePatient } = useData();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const p = await fetchPatientDetails(id);
        setPatient(p);
      } catch (e) {
        setError("Failed to load patient");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, fetchPatientDetails]);

  if (loading) {
    return <div className="p-8 flex justify-center"><div className="animate-spin text-indigo-600"><RefreshCw size={24} /></div></div>;
  }

  if (!patient || error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-800 mb-6">
          <ArrowLeft size={16} className="mr-2" /> Back to Patient Details
        </button>
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-100 flex flex-col items-center">
          <AlertCircle size={32} className="mb-2" />
          <p className="font-semibold text-lg">{error || "Patient not found"}</p>
        </div>
      </div>
    );
  }

  const { metadata } = patient;
  const isLinked = metadata.abhaLinked;

  const handleVerify = async () => {
    setActionLoading("verify");
    try {
      const input = prompt("Enter ABHA ID to verify (format: xx-xxxx-xxxx-xxxx):", metadata.abhaId || "");
      if (!input) return;
      await abhaService.verifyAbha(id, input);
      const updated = await fetchPatientDetails(id);
      setPatient(updated);
    } catch (e) {
      alert("Failed to verify ABHA ID: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestConsent = async () => {
    setActionLoading("consent");
    try {
      await abhaService.requestConsent(id);
      const updated = await fetchPatientDetails(id);
      setPatient(updated);
    } catch (e) {
      alert("Failed to request consent: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSyncRecords = async () => {
    setActionLoading("sync");
    try {
      const res = await abhaService.syncRecords(id);
      alert(`Successfully synced ${res.recordsImported} records!`);
      const updated = await fetchPatientDetails(id);
      setPatient(updated);
    } catch (e) {
      alert("Failed to sync records: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnlink = async () => {
    if (!window.confirm("Are you sure you want to unlink the ABHA ID? This will revoke consent and stop syncing records.")) return;
    setActionLoading("unlink");
    try {
      await abhaService.unlinkAbha(id);
      const updated = await fetchPatientDetails(id);
      setPatient(updated);
    } catch (e) {
      alert("Failed to unlink: " + e.message);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto h-[calc(100vh-4rem)] overflow-y-auto custom-scrollbar">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-slate-200 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Shield className="text-blue-600" /> ABHA Management
            </h1>
            <p className="text-slate-500 mt-1">Manage Ayushman Bharat Health Account for {metadata.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-indigo-500" /> Linkage Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">ABHA ID</span>
                <span className="font-medium text-slate-800 font-mono">{metadata.abhaId || "Not Provided"}</span>
              </div>
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
                <span className="text-sm text-slate-500">Consent</span>
                <span className="font-medium text-slate-800">{metadata.consentStatus || "Not Requested"}</span>
              </div>
              <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                <span className="text-sm text-slate-500">Last Synced</span>
                <span className="font-medium text-slate-800">
                  {metadata.lastSync ? new Date(metadata.lastSync).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {!isLinked ? (
              <button
                onClick={handleVerify}
                disabled={actionLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
              >
                {actionLoading === "verify" ? <RefreshCw className="animate-spin" size={16} /> : <ShieldCheck size={16} />}
                Verify & Link ABHA
              </button>
            ) : (
              <button
                onClick={handleUnlink}
                disabled={actionLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-semibold rounded-xl transition disabled:opacity-50"
              >
                {actionLoading === "unlink" ? <RefreshCw className="animate-spin" size={16} /> : <AlertCircle size={16} />}
                Unlink Account
              </button>
            )}
          </div>
        </div>

        {/* Actions Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={18} className="text-amber-500" /> Consent Management
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Request consent from the patient's ABHA app (PHR) to view and download their medical records from other health facilities.
            </p>
            <button
              onClick={handleRequestConsent}
              disabled={!isLinked || actionLoading}
              className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 font-semibold rounded-xl transition disabled:opacity-50"
            >
               {actionLoading === "consent" ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
               Request Consent
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
             <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <DownloadCloud size={18} className="text-teal-500" /> Medical Records
            </h2>
            <p className="text-sm text-slate-500 mb-6">
              Sync and view imported clinical records including prescriptions, lab reports, and consultations.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleSyncRecords}
                disabled={!isLinked || metadata.consentStatus !== "Granted" && metadata.consentStatus !== "Consent Pending" || actionLoading}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-teal-700 font-semibold rounded-xl transition disabled:opacity-50"
              >
                {actionLoading === "sync" ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                Sync Records Now
              </button>
              <button
                onClick={() => navigate(`/patients/${id}/records`)}
                disabled={!isLinked || metadata.abhaStatus !== "Synced"}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition disabled:opacity-50"
              >
                View Imported Records →
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
