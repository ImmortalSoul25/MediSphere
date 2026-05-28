// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider } from "./context/DataContext";

import MainLayout from "./layouts/MainLayout";
import Dashboard  from "./pages/Dashboard";
import Patients   from "./pages/Patients";
import Templates  from "./pages/Templates";
import Logs       from "./pages/Logs";

export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/patients"  element={<Patients />} />
            <Route path="/templates" element={<Templates />} />
            <Route path="/logs"      element={<Logs />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </DataProvider>
  );
}