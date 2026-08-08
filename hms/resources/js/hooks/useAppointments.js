import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { appointmentsApi } from '../api/appointments';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const APPOINTMENT_KEYS = {
    all:    ['appointments'],
    list:   (params) => ['appointments', 'list', params],
    detail: (id) => ['appointments', 'detail', id],
    today:  () => ['appointments', 'today'],
};

/**
 * useAppointments — paginated list with optional filters.
 * @param {object} params — e.g. { page, per_page, status, date, search }
 */
export const useAppointments = (params = {}) => {
    return useQuery({
        queryKey: APPOINTMENT_KEYS.list(params),
        queryFn: () => appointmentsApi.getAppointments(params),
        keepPreviousData: true,
        staleTime: 30 * 1000, // 30 seconds
    });
};

/**
 * useTodayAppointments — convenience hook for today's schedule.
 */
export const useTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return useQuery({
        queryKey: APPOINTMENT_KEYS.today(),
        queryFn: () => appointmentsApi.getAppointments({ date: today, per_page: 50 }),
        staleTime: 60 * 1000, // 1 min
    });
};

/**
 * useAppointment — single appointment detail.
 * @param {number|string} id
 */
export const useAppointment = (id) => {
    return useQuery({
        queryKey: APPOINTMENT_KEYS.detail(id),
        queryFn: () => appointmentsApi.getAppointmentDetails(id),
        enabled: !!id,
        staleTime: 30 * 1000,
    });
};

/**
 * useBookAppointment — mutation to create a new appointment.
 */
export const useBookAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => appointmentsApi.bookAppointment(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
        },
    });
};

/**
 * useUpdateAppointmentStatus — mutation to update appointment status.
 */
export const useUpdateAppointmentStatus = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, status }) => appointmentsApi.updateStatus(id, status),
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.detail(id) });
        },
    });
};

/**
 * useCancelAppointment — mutation to cancel (delete) an appointment.
 */
export const useCancelAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (id) => appointmentsApi.cancel(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
        },
    });
};

/**
 * useInstantBook — mutation to create an instant appointment.
 */
export const useInstantBook = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => appointmentsApi.instantBook(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
        },
    });
};

/**
 * useReschedule — mutation to reschedule an appointment.
 */
export const useReschedule = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, data }) => appointmentsApi.reschedule(id, data),
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.detail(id) });
        },
    });
};

/**
 * useCancelWithReason — mutation to cancel an appointment with a reason.
 */
export const useCancelWithReason = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ id, reason }) => appointmentsApi.cancelWithReason(id, reason),
        onSuccess: (_data, { id }) => {
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.all });
            queryClient.invalidateQueries({ queryKey: APPOINTMENT_KEYS.detail(id) });
        },
    });
};
