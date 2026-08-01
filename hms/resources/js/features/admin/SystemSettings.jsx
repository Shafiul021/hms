import React, { useState } from 'react';
import { Settings, Hospital, Shield, Bell, Database, Globe, ChevronRight, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';

// ── Section wrapper ────────────────────────────────────────────────────────────
const SettingsSection = ({ icon: Icon, title, description, children }) => (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
                <Icon className="w-4 h-4 text-indigo-500" />
            </div>
            <div>
                <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
                {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
            </div>
        </div>
        <div className="divide-y divide-gray-100">{children}</div>
    </div>
);

// ── Single setting row ─────────────────────────────────────────────────────────
const SettingRow = ({ label, description, children }) => (
    <div className="flex items-center justify-between gap-6 px-6 py-4">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">{label}</p>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <div className="flex-shrink-0">{children}</div>
    </div>
);

// ── Toggle switch ──────────────────────────────────────────────────────────────
const Toggle = ({ id, checked, onChange }) => (
    <button
        id={id}
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 ${
            checked ? 'bg-indigo-500' : 'bg-gray-200'
        }`}
    >
        <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ${
                checked ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
    </button>
);

// ── Main Page ──────────────────────────────────────────────────────────────────
export const SystemSettings = () => {
    const [toasts, setToasts] = useState([]);

    // Settings state
    const [emailNotifications,  setEmailNotifications]  = useState(true);
    const [pushNotifications,   setPushNotifications]   = useState(true);
    const [appointmentReminders, setAppointmentReminders] = useState(true);
    const [labResultAlerts,     setLabResultAlerts]     = useState(true);
    const [lowStockAlerts,      setLowStockAlerts]      = useState(true);
    const [maintenanceMode,     setMaintenanceMode]     = useState(false);
    const [registrationOpen,    setRegistrationOpen]    = useState(true);
    const [autoGenerateBills,   setAutoGenerateBills]   = useState(false);
    const [twoFactorRequired,   setTwoFactorRequired]   = useState(false);
    const [sessionTimeout,      setSessionTimeout]      = useState('60');

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    const handleSave = () => {
        // In production this would POST to a settings API endpoint.
        // For now, simulate a save action.
        addToast('System settings saved successfully!', 'success');
    };

    return (
        <div className="p-6 max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Settings className="w-6 h-6 text-indigo-500" />
                        System Settings
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Configure system-wide behaviour, notifications, and security policies.
                    </p>
                </div>
                <Button onClick={handleSave} icon={<Check className="w-4 h-4" />} id="save-settings-btn">
                    Save Changes
                </Button>
            </div>

            {/* ── Notifications ─────────────────────────────────────────────── */}
            <SettingsSection
                icon={Bell}
                title="Notifications"
                description="Control how and when the system sends alerts."
            >
                <SettingRow
                    label="Email Notifications"
                    description="Send transactional emails for appointments, lab results, and billing."
                >
                    <Toggle
                        id="toggle-email"
                        checked={emailNotifications}
                        onChange={setEmailNotifications}
                    />
                </SettingRow>
                <SettingRow
                    label="Push / Real-time Notifications"
                    description="Live in-app alerts via Pusher WebSocket."
                >
                    <Toggle
                        id="toggle-push"
                        checked={pushNotifications}
                        onChange={setPushNotifications}
                    />
                </SettingRow>
                <SettingRow
                    label="Appointment Reminder Emails"
                    description="Send reminder emails 24 hours before each appointment."
                >
                    <Toggle
                        id="toggle-appt-reminder"
                        checked={appointmentReminders}
                        onChange={setAppointmentReminders}
                    />
                </SettingRow>
                <SettingRow
                    label="Lab Result Alerts"
                    description="Notify doctor and patient when a lab result is uploaded."
                >
                    <Toggle
                        id="toggle-lab-alerts"
                        checked={labResultAlerts}
                        onChange={setLabResultAlerts}
                    />
                </SettingRow>
                <SettingRow
                    label="Low Stock Alerts"
                    description="Email admin when a medicine falls below its threshold."
                >
                    <Toggle
                        id="toggle-stock-alerts"
                        checked={lowStockAlerts}
                        onChange={setLowStockAlerts}
                    />
                </SettingRow>
            </SettingsSection>

            {/* ── Hospital Operations ─────────────────────────────────────────── */}
            <SettingsSection
                icon={Hospital}
                title="Hospital Operations"
                description="Control patient-facing features and automation."
            >
                <SettingRow
                    label="Open Patient Registration"
                    description="Allow new patients to self-register via the public sign-up page."
                >
                    <Toggle
                        id="toggle-registration"
                        checked={registrationOpen}
                        onChange={setRegistrationOpen}
                    />
                </SettingRow>
                <SettingRow
                    label="Auto-Generate Bills"
                    description="Automatically generate a bill when an appointment is marked completed."
                >
                    <Toggle
                        id="toggle-auto-bill"
                        checked={autoGenerateBills}
                        onChange={setAutoGenerateBills}
                    />
                </SettingRow>
                <SettingRow
                    label="Session Timeout (minutes)"
                    description="Automatically log out inactive users after this period."
                >
                    <select
                        id="session-timeout-select"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 bg-white"
                    >
                        {['15', '30', '60', '120', '480'].map((v) => (
                            <option key={v} value={v}>
                                {v} min
                            </option>
                        ))}
                    </select>
                </SettingRow>
            </SettingsSection>

            {/* ── Security ──────────────────────────────────────────────────── */}
            <SettingsSection
                icon={Shield}
                title="Security"
                description="Authentication and access control policies."
            >
                <SettingRow
                    label="Require Two-Factor Authentication"
                    description="Enforce 2FA for all staff accounts (admin, doctor, nurse, receptionist)."
                >
                    <Toggle
                        id="toggle-2fa"
                        checked={twoFactorRequired}
                        onChange={setTwoFactorRequired}
                    />
                </SettingRow>
                <SettingRow
                    label="Maintenance Mode"
                    description="Take the HMS offline for maintenance. Only admins can log in."
                >
                    <Toggle
                        id="toggle-maintenance"
                        checked={maintenanceMode}
                        onChange={(v) => {
                            setMaintenanceMode(v);
                            if (v) addToast('Maintenance mode enabled — other users will be locked out.', 'error');
                        }}
                    />
                </SettingRow>
            </SettingsSection>

            {/* ── System Info ───────────────────────────────────────────────── */}
            <SettingsSection
                icon={Database}
                title="System Information"
                description="Read-only runtime details."
            >
                {[
                    { label: 'Application Version',  value: 'HMS v1.0.0' },
                    { label: 'Framework',            value: 'Laravel 11 + React 18' },
                    { label: 'Queue Driver',         value: 'Redis (Horizon)' },
                    { label: 'Broadcast Driver',     value: 'Pusher' },
                    { label: 'Storage',              value: 'Local (private)' },
                ].map(({ label, value }) => (
                    <SettingRow key={label} label={label}>
                        <span className="text-sm font-mono text-gray-500">{value}</span>
                    </SettingRow>
                ))}
            </SettingsSection>

            {/* Toasts */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((t) => (
                    <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />
                ))}
            </div>
        </div>
    );
};
