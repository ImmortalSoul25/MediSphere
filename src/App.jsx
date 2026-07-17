// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DataProvider }         from "./context/DataContext";
import { AppointmentsProvider } from "./context/AppointmentsContext";
import { TemplatesProvider }    from "./context/TemplatesContext";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./context/ProtectedRoute";

import MainLayout            from "./layouts/MainLayout";
import Login                 from "./pages/Login";
import Dashboard             from "./pages/Dashboard";
import Queue                 from "./pages/queue/Queue";
import Patients              from "./pages/Patients";
import PatientDetails        from "./pages/PatientDetails";
import PatientFormPage       from "./pages/PatientFormPage";
import TodayAppointments       from "./pages/appointments/TodayAppointments";
import RequestsPending from "./pages/appointments/RequestsPending";
import RequestsRejected from "./pages/appointments/RequestsRejected";
import RequestsExpired from "./pages/appointments/RequestsExpired";
import ScheduledAppointments from "./pages/appointments/ScheduledAppointments";
import PastAppointments      from "./pages/appointments/PastAppointments";
import SendMessages          from "./pages/SendMessages";
import MessageTemplates      from "./pages/MessageTemplates";
import PregnancyTemplateDetail from "./pages/templates/PregnancyTemplateDetail";
import AppointmentTemplateDetail from "./pages/templates/AppointmentTemplateDetail";
import SettingsPage          from "./pages/Settings";
import AbhaManagement        from "./pages/AbhaManagement";
import ImportedRecords       from "./pages/ImportedRecords";
import CalendarPage          from "./pages/calendar/CalendarPage";
import AddEventPage          from "./pages/calendar/AddEventPage";

export default function App() {
  return (
    <AuthProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                
                <Route element={
                  <ProtectedRoute>
                    <DataProvider>
                      <AppointmentsProvider>
                        <TemplatesProvider>
                          <MainLayout />
                        </TemplatesProvider>
                      </AppointmentsProvider>
                    </DataProvider>
                  </ProtectedRoute>
                }>
                <Route path="/dashboard"               element={<Dashboard />} />
                <Route path="/calendar"                element={<CalendarPage />} />
                <Route path="/calendar/add"            element={<AddEventPage />} />
                <Route path="/calendar/:id/edit"       element={<AddEventPage />} />
                <Route path="/queue"                   element={<Queue />} />
                <Route path="/patients"                element={<Patients />} />
                <Route path="/patients/add"            element={<PatientFormPage />} />
                <Route path="/patients/:id"            element={<PatientDetails />} />
                <Route path="/patients/:id/edit"       element={<PatientFormPage />} />
                <Route path="/patients/:id/abha"       element={<AbhaManagement />} />
                <Route path="/patients/:id/records"    element={<ImportedRecords />} />
                <Route path="/appointments/today"      element={<TodayAppointments />} />
                <Route path="/appointments/requests"   element={<RequestsPending />} />
                <Route path="/appointments/requests/rejected" element={<RequestsRejected />} />
                <Route path="/appointments/requests/expired" element={<RequestsExpired />} />
                <Route path="/appointments/scheduled"  element={<ScheduledAppointments />} />
                <Route path="/appointments/past"       element={<PastAppointments />} />
                <Route path="/send-messages"           element={<SendMessages />} />
                <Route path="/message-templates"       element={<MessageTemplates />} />
                <Route path="/templates/pregnancy/:week" element={<PregnancyTemplateDetail />} />
                <Route path="/templates/appointments/:id" element={<AppointmentTemplateDetail />} />
                <Route path="/settings"                element={<SettingsPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </BrowserRouter>
    </AuthProvider>
  );
}