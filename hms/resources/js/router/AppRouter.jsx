import React from 'react';
import { Routes, Route, Navigate, Link } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { Sidebar } from '../components/layout/Sidebar';
import { TopBar } from '../components/layout/TopBar';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';
import { useAuthStore } from '../store/authStore';
import { LoginPage } from '../features/auth/LoginPage';
import { RegisterPage } from '../features/auth/RegisterPage';
import { AppointmentList } from '../features/appointments/AppointmentList';
import { BookAppointment } from '../features/appointments/BookAppointment';
import { AppointmentForm } from '../features/appointments/AppointmentForm';
import { PatientList } from '../features/patients/PatientList';
import { PatientDetail } from '../features/patients/PatientDetail';
import { ConsultationView } from '../features/doctor/ConsultationView';
import { DoctorSchedule } from '../features/doctor/DoctorSchedule';
import { PatientForm } from '../features/patients/PatientForm';
import { DoctorForm } from '../features/doctor/DoctorForm';
import { WardMap } from '../features/ipd/WardMap';
import { AdmissionForm } from '../features/ipd/AdmissionForm';
import { NurseDashboard } from '../features/nurse/NurseDashboard';
import { LabQueue } from '../features/lab/LabQueue';
import { UploadResult } from '../features/lab/UploadResult';
import { ResultViewer } from '../features/lab/ResultViewer';
import { BillList } from '../features/billing/BillList';
import { BillDetail } from '../features/billing/BillDetail';
import { Inventory } from '../features/pharmacy/Inventory';
import { DispensePrescription } from '../features/pharmacy/DispensePrescription';
import { UserManagement } from '../features/admin/UserManagement';
import { ActivityLog } from '../features/admin/ActivityLog';
import { SystemSettings } from '../features/admin/SystemSettings';
import { ProfileLayout } from '../features/profile/ProfileLayout';
import { PatientDashboard } from '../features/patient/PatientDashboard';
import { ReceptionistDashboard } from '../features/receptionist/ReceptionistDashboard';
import { AdminDashboard } from '../features/admin/AdminDashboard';
import { DoctorDashboard } from '../features/doctor/DoctorDashboard';
import { DoctorList } from '../features/doctor/DoctorList';
import { DiagnosisList } from '../features/doctor/DiagnosisList';
import { NursingNotesPage } from '../features/ipd/NursingNotesPage';
import { PrescriptionView } from '../components/prescriptions/PrescriptionView';

// ── Role-aware Dashboard ───────────────────────────────────────────────────
const RoleDashboard = () => {
    const { user } = useAuthStore();
    const role = user?.roles?.[0] ?? user?.role ?? '';

    switch (role) {
        case 'patient':      return <PatientDashboard />;
        case 'receptionist': return <ReceptionistDashboard />;
        case 'nurse':        return <NurseDashboard />;
        case 'doctor':       return <DoctorDashboard />;
        case 'admin':
        default:             return <AdminDashboard />;
    }
};



// ── Polished Unauthorized page (renders INSIDE the layout with sidebar) ──────
const UnauthorizedPage = () => {
    const { user } = useAuthStore();
    const roles = Array.isArray(user?.roles)
        ? user.roles.map(r => r.name || r)
        : [user?.role].filter(Boolean);

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[70vh] p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-rose-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
            <p className="text-slate-500 mb-1 max-w-sm">
                You don&apos;t have permission to view this page.
            </p>
            {roles.length > 0 && (
                <p className="text-sm text-slate-400 mb-6">
                    Your current role — <span className="font-semibold text-slate-600 capitalize">{roles[0]}</span> — does not include access to this module.
                </p>
            )}
            <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
            >
                ← Back to Dashboard
            </Link>
        </div>
    );
};

// Layout Wrapper
const DashboardLayout = () => {
    return (
        <div className="flex bg-gray-50 h-screen overflow-hidden">
            <Sidebar />
            {/* On mobile the sidebar is a drawer so this div takes full width */}
            <div className="flex-1 flex flex-col min-w-0 w-full h-screen">
                <TopBar />
                <main className="flex-1 overflow-y-auto">
                    <ErrorBoundary>
                    <Routes>
                        {/* Role-aware dashboard */}
                        <Route path="dashboard" element={<RoleDashboard />} />
                        <Route path="unauthorized" element={<UnauthorizedPage />} />
                        <Route path="profile" element={<ProfileLayout />} />

                        {/* Appointments & Prescriptions — all authenticated roles */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'nurse', 'patient']} />}>
                            <Route path="appointments" element={<AppointmentList />} />
                            <Route path="appointments/:id" element={<AppointmentList />} />
                            <Route path="prescriptions/:id/view" element={<PrescriptionView />} />
                        </Route>

                        {/* Book / edit appointments — staff + patient */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']} />}>
                            <Route path="appointments/book" element={<BookAppointment />} />
                            <Route path="appointments/new" element={<AppointmentForm />} />
                            <Route path="appointments/:id/edit" element={<AppointmentForm />} />
                        </Route>

                        {/* Doctors list — viewable by most roles */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'patient']} />}>
                            <Route path="doctors" element={<DoctorList />} />
                        </Route>

                        {/* Doctor-only consultation & schedule */}
                        <Route element={<ProtectedRoute allowedRoles={['doctor']} />}>
                            <Route path="appointments/:appointmentId/consult" element={<ConsultationView />} />
                            <Route path="doctors/schedule" element={<DoctorSchedule />} />
                        </Route>

                        {/* Patients — clinical staff */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'receptionist', 'nurse']} />}>
                            <Route path="patients" element={<PatientList />} />
                            <Route path="patients/:id" element={<PatientDetail />} />
                        </Route>

                        {/* Patient create/edit — admin & receptionist */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'receptionist']} />}>
                            <Route path="patients/new" element={<PatientForm />} />
                            <Route path="patients/:id/edit" element={<PatientForm />} />
                        </Route>

                        {/* OPD Diagnoses — admin & doctor */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor']} />}>
                            <Route path="diagnoses" element={<DiagnosisList />} />
                        </Route>

                        {/* Lab results view — clinical staff + patient */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse', 'patient']} />}>
                            <Route path="lab" element={<LabQueue />} />
                            <Route path="lab/:id/result" element={<ResultViewer />} />
                        </Route>

                        {/* Lab result upload — admin & nurse */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'nurse']} />}>
                            <Route path="lab/:id/upload" element={<UploadResult />} />
                        </Route>

                        {/* IPD / Ward — admin, doctor, nurse */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'doctor', 'nurse']} />}>
                            <Route path="ipd" element={<WardMap />} />
                            <Route path="ipd/admit" element={<AdmissionForm />} />
                            <Route path="ipd/:admissionId/notes" element={<NursingNotesPage />} />
                            <Route path="nurse/dashboard" element={<NurseDashboard />} />
                        </Route>

                        {/* Pharmacy — admin, receptionist, nurse */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'receptionist', 'nurse']} />}>
                            <Route path="pharmacy" element={<Inventory />} />
                            <Route path="pharmacy/dispense" element={<DispensePrescription />} />
                            <Route path="pharmacy/dispense/:prescriptionId" element={<DispensePrescription />} />
                        </Route>

                        {/* Billing — admin, receptionist, patient */}
                        <Route element={<ProtectedRoute allowedRoles={['admin', 'receptionist', 'patient']} />}>
                            <Route path="billing" element={<BillList />} />
                            <Route path="billing/:id" element={<BillDetail />} />
                        </Route>

                        {/* Admin-only */}
                        <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                            <Route path="doctors/new" element={<DoctorForm />} />
                            <Route path="doctors/:id/edit" element={<DoctorForm />} />
                            <Route path="admin/users" element={<UserManagement />} />
                            <Route path="admin/activity-log" element={<ActivityLog />} />
                            <Route path="settings" element={<SystemSettings />} />
                        </Route>

                        {/* Redirect bare path to dashboard */}
                        <Route path="" element={<Navigate to="dashboard" replace />} />
                    </Routes>
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
};

export const AppRouter = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Authenticated shell — unauthorized page lives inside the layout */}
            <Route path="/*" element={<ProtectedRoute />}>
                <Route path="*" element={<DashboardLayout />} />
            </Route>
        </Routes>
    );
};
