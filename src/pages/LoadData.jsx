// src/pages/LoadData.jsx
//
// Shown on first launch (or when no data is loaded yet).
// The user either:
//   (A) uploads their existing maternal-portal-data.xlsx, OR
//   (B) downloads a starter template and starts fresh
//
// Once a file is loaded, the app navigates to /dashboard automatically.

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet, Download, AlertCircle } from "lucide-react";
import { useData } from "../context/DataContext";
import { downloadStarterWorkbook } from "../utils/excelStore";
import { useNavigate } from "react-router-dom";

export default function LoadData() {
  const { loadFile, loadDefaults, loading, error } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("Please upload an Excel file (.xlsx or .xls)");
      return;
    }
    loadFile(file);
    // Navigate after a short tick so state can settle
    setTimeout(() => navigate("/dashboard"), 300);
  };

  const handleInputChange = (e) => handleFile(e.target.files[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleStartFresh = () => {
    loadDefaults();
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg border border-slate-100 w-full max-w-lg p-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-teal-50 p-3 rounded-xl">
            <FileSpreadsheet size={28} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Load Patient Data</h1>
            <p className="text-sm text-slate-500">Connect your Excel workbook to get started</p>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-6 mt-3 leading-relaxed">
          The portal reads patient records and weekly message templates from an Excel file
          with two sheets: <span className="font-semibold text-slate-700">Patients</span> and{" "}
          <span className="font-semibold text-slate-700">Templates</span>. Any changes you
          make in the portal are automatically saved back to the file.
        </p>

        {/* Drop zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`cursor-pointer border-2 border-dashed rounded-xl px-6 py-10
            flex flex-col items-center justify-center text-center transition-all duration-150
            ${dragOver
              ? "border-teal-400 bg-teal-50"
              : "border-slate-200 bg-slate-50 hover:border-teal-300 hover:bg-teal-50/40"
            }`}
        >
          <Upload
            size={32}
            className={`mb-3 transition-colors ${dragOver ? "text-teal-500" : "text-slate-300"}`}
          />
          <p className="text-sm font-semibold text-slate-700">
            {loading ? "Reading file…" : "Drop your Excel file here, or click to browse"}
          </p>
          <p className="text-xs text-slate-400 mt-1">.xlsx files only</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          className="hidden"
          onChange={handleInputChange}
        />

        {/* Error */}
        {error && (
          <div className="mt-4 flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100
                          rounded-xl px-4 py-3 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-100" />
          <span className="text-xs text-slate-400">or</span>
          <div className="flex-1 h-px bg-slate-100" />
        </div>

        {/* Options row */}
        <div className="mt-5 flex flex-col sm:flex-row gap-3">
          {/* Download starter */}
          <button
            onClick={downloadStarterWorkbook}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3
                       border border-slate-200 rounded-xl text-sm font-semibold
                       text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition"
          >
            <Download size={15} />
            Download Starter Template
          </button>

          {/* Start fresh (empty patients, default templates) */}
          <button
            onClick={handleStartFresh}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3
                       bg-teal-600 hover:bg-teal-700 rounded-xl text-sm font-semibold
                       text-white shadow-sm transition"
          >
            Start Fresh (No File)
          </button>
        </div>

        <p className="text-xs text-slate-400 mt-4 text-center">
          "Start Fresh" uses default templates and an empty patient list.
          You can export to Excel at any time from the toolbar.
        </p>
      </div>
    </div>
  );
}