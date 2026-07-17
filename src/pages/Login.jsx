import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, Lock, ArrowRight, Activity, Loader2 } from "lucide-react";

export default function Login() {
  const [role, setRole] = useState(null); // 'receptionist' or 'doctor'
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSelectRole = (selectedRole) => {
    if (selectedRole === "doctor") {
      alert("Doctor's view not implemented yet.");
      return;
    }
    setRole(selectedRole);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) {
      setError("Please enter a password.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const res = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, password }),
      });

      if (!res.ok) {
        let errorMsg = "Invalid password";
        try {
          const errData = await res.json();
          errorMsg = errData.detail || errorMsg;
        } catch (e) {}
        throw new Error(errorMsg);
      }

      const data = await res.json();
      login(data.access_token, data.role);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center">
            <Activity className="w-8 h-8 text-indigo-600" />
          </div>
        </div>
        <h2 className="text-center text-3xl font-bold tracking-tight text-slate-800">
          MediSphere Portal
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500">
          Sign in to access your clinic workspace
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
          {!role ? (
            <div className="space-y-4">
              <button
                onClick={() => handleSelectRole("receptionist")}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:border-indigo-600 hover:bg-indigo-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <User size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">Receptionist</p>
                    <p className="text-xs text-slate-500 font-medium">Manage patients & queue</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </button>

              <button
                onClick={() => handleSelectRole("doctor")}
                className="w-full flex items-center justify-between p-4 border border-slate-200 rounded-2xl hover:border-teal-600 hover:bg-teal-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <Activity size={20} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-slate-800">Doctor</p>
                    <p className="text-xs text-slate-500 font-medium">View medical records</p>
                  </div>
                </div>
                <ArrowRight size={20} className="text-slate-300 group-hover:text-teal-600 transition-colors" />
              </button>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <button
                  type="button"
                  onClick={() => setRole(null)}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-semibold mb-4 inline-block"
                >
                  &larr; Back to roles
                </button>
                <label className="block text-sm font-medium text-slate-700">
                  Password for {role === "receptionist" ? "Receptionist" : "Doctor"}
                </label>
                <div className="mt-2 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-slate-50 focus:bg-white transition-colors"
                    placeholder="Enter password"
                  />
                </div>
              </div>

              {error && (
                <div className="text-sm text-rose-500 bg-rose-50 border border-rose-100 p-3 rounded-lg font-medium">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-colors items-center gap-2"
              >
                {busy && <Loader2 size={16} className="animate-spin" />}
                Sign in
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
