import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

// ── Query Keys ────────────────────────────────────────────────────────────────
export const AUTH_KEYS = {
    me: ['auth', 'me'],
};

/**
 * useMe — fetches the authenticated user profile.
 * Automatically keeps authStore in sync when the server returns fresh data.
 */
export const useMe = () => {
    const { isAuthenticated, setAuth, token } = useAuthStore();
    return useQuery({
        queryKey: AUTH_KEYS.me,
        queryFn: async () => {
            const data = await authApi.getMe();
            // Keep Zustand store hydrated with fresh server data
            if (data?.data) setAuth(data.data, token);
            return data?.data ?? null;
        },
        enabled: isAuthenticated,
        staleTime: 5 * 60 * 1000, // 5 min
    });
};

/**
 * useUpdateProfile — mutation wrapper for profile updates.
 */
export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: (data) => authApi.updateProfile(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: AUTH_KEYS.me });
        },
    });
};

/**
 * useChangePassword — mutation wrapper for password changes.
 */
export const useChangePassword = () => {
    return useMutation({
        mutationFn: (data) => authApi.changePassword(data),
    });
};

/**
 * useLogout — mutation wrapper that clears auth store and redirects.
 */
export const useLogout = () => {
    const { logout } = useAuthStore();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: () => authApi.logout(),
        onSettled: () => {
            logout();
            queryClient.clear();
            navigate('/login');
        },
    });
};
