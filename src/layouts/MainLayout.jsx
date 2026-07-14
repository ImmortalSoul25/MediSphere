// src/layouts/MainLayout.jsx
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  useEffect(() => {
    fetch("/portal-settings")
      .then((res) => res.json())
      .then((settings) => {
        document.documentElement.classList.toggle("dark", settings.theme === "dark");
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-100 app-shell">
      <Sidebar />
      <div className="flex-1 p-8">
        <Outlet />
      </div>
    </div>
  );
}
