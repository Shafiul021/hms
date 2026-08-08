import React, { useEffect } from 'react';
import { AppRouter } from './router/AppRouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import { initializeEcho, resetEcho } from './lib/echo';
import { useNotifications } from './hooks/useNotifications';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

/**
 * NotificationGateway — thin component that subscribes to realtime channels.
 * Must live inside QueryClientProvider so any future useQuery calls inside
 * useNotifications have access to the client.
 */
const NotificationGateway = () => {
    useNotifications();
    return null;
};

import { Toaster } from 'react-hot-toast';

export const AppRoot = () => {
    const { token, isAuthenticated } = useAuthStore();

    useEffect(() => {
        if (isAuthenticated && token) {
            initializeEcho(token);
        } else {
            resetEcho();
        }
        return () => {
            resetEcho();
        };
    }, [token, isAuthenticated]);

    return (
        <QueryClientProvider client={queryClient}>
            {/* Subscribe to Pusher/Reverb channels when authenticated */}
            {isAuthenticated && <NotificationGateway />}
            <AppRouter />
            <Toaster position="top-right" />
        </QueryClientProvider>
    );
};

export default AppRoot;
