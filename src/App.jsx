// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider }         from "./context/DataContext";
import { AppointmentsProvider } from "./context/AppointmentsContext";
import { TemplatesProvider }    from "./context/TemplatesContext";

import MainLayout            from "./layouts/MainLayout";
import Dashboard             from "./pages/Dashboard";
import Patients              from "./pages/Patients";
import RequestsPending       from "./pages/appointments/RequestsPending";
import ScheduledAppointments from "./pages/appointments/ScheduledAppointments";
import PastAppointments      from "./pages/appointments/PastAppointments";
import SendMessages          from "./pages/SendMessages";
import MessageTemplates      from "./pages/MessageTemplates";
import SettingsPage          from "./pages/Settings";

export default function App() {
  return (
    <DataProvider>
      <AppointmentsProvider>
        <TemplatesProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/dashboard"               element={<Dashboard />} />
                <Route path="/patients"                element={<Patients />} />
                <Route path="/appointments/requests"   element={<RequestsPending />} />
                <Route path="/appointments/scheduled"  element={<ScheduledAppointments />} />
                <Route path="/appointments/past"       element={<PastAppointments />} />
                <Route path="/send-messages"           element={<SendMessages />} />
                <Route path="/message-templates"       element={<MessageTemplates />} />
                <Route path="/settings"                element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </BrowserRouter>
        </TemplatesProvider>
      </AppointmentsProvider>
    </DataProvider>
  );
}