import { useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { initializeEcho, resetEcho } from '../lib/echo';

/**
 * useNotifications
 *
 * Establishes Laravel Echo subscriptions for the currently logged-in user.
 * Subscribes to:
 *   - patient private channel  → AppointmentStatusChanged
 *   - doctor  private channel  → LabResultUploaded
 *   - admin   private channel  → UserRegistered, generic system events
 *
 * Call this hook once inside a component that is always mounted while the
 * user is authenticated (e.g. inside AppRoot or a top-level layout).
 *
 * Requires Pusher/Reverb credentials in .env; gracefully no-ops if absent.
 */
export const useNotifications = () => {
    const { user, token, isAuthenticated } = useAuthStore();
    const { add } = useNotificationStore();

    // Keep mutable ref to avoid stale closure in cleanup
    const echoRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated || !token || !user) return;

        // Initialise Echo (returns null when no WS key configured)
        const echo = initializeEcho(token);
        echoRef.current = echo;

        if (!echo) return; // Graceful no-op — no Pusher/Reverb configured

        const roles = Array.isArray(user?.roles)
            ? user.roles.map(r => r.name || r)
            : [user?.role].filter(Boolean);

        const hasRole = (r) => roles.includes(r);

        // ── Patient channel ─────────────────────────────────────────────────
        if (hasRole('patient') || hasRole('admin')) {
            echo
                .private(`patient.${user.id}`)
                .listen('.AppointmentStatusChanged', (event) => {
                    add({
                        id: `appt-${event.appointment_id ?? Date.now()}`,
                        message: event.message
                            ?? `Your appointment status changed to: ${event.status ?? 'updated'}`,
                        type: 'info',
                        link: '/appointments',
                    });
                });
        }

        // ── Doctor channel ────────────────────────────────────────────────────
        if (hasRole('doctor') || hasRole('admin')) {
            echo
                .private(`doctor.${user.id}`)
                .listen('.LabResultUploaded', (event) => {
                    add({
                        id: `lab-${event.lab_result_id ?? Date.now()}`,
                        message: event.message
                            ?? `Lab result uploaded for patient #${event.patient_id ?? ''}`,
                        type: 'warning',
                        link: event.lab_result_id ? `/lab/${event.lab_result_id}/result` : '/lab',
                    });
                });
        }

        // ── Admin channel ─────────────────────────────────────────────────────
        if (hasRole('admin')) {
            echo
                .private('admin')
                .listen('.UserRegistered', (event) => {
                    add({
                        id: `user-${event.user_id ?? Date.now()}`,
                        message: event.message ?? `New user registered: ${event.name ?? ''}`,
                        type: 'success',
                        link: '/admin/users',
                    });
                });
        }

        // ── Cleanup — leave all channels on unmount or auth change ────────────
        return () => {
            if (echoRef.current) {
                if (hasRole('patient') || hasRole('admin')) {
                    echoRef.current.leave(`patient.${user.id}`);
                }
                if (hasRole('doctor') || hasRole('admin')) {
                    echoRef.current.leave(`doctor.${user.id}`);
                }
                if (hasRole('admin')) {
                    echoRef.current.leave('admin');
                }
            }
        };
    }, [isAuthenticated, token, user?.id]);
};
