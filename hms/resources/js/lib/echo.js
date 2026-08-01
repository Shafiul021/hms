import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

export const initializeEcho = (token) => {
    if (!token) return null;

    // Only connect if an app key is actually configured — avoids 404 WebSocket errors
    // when BROADCAST_CONNECTION=log and no Pusher/Reverb keys are set.
    const appKey =
        import.meta.env.VITE_REVERB_APP_KEY ||
        import.meta.env.VITE_PUSHER_APP_KEY;

    if (!appKey) {
        console.info('[Echo] No WebSocket key configured — real-time notifications disabled.');
        return null;
    }

    return new Echo({
        broadcaster: 'reverb',
        key: appKey,
        wsHost: import.meta.env.VITE_REVERB_HOST || import.meta.env.VITE_PUSHER_HOST || window.location.hostname,
        wsPort: import.meta.env.VITE_REVERB_PORT || import.meta.env.VITE_PUSHER_PORT || 8080,
        wssPort: import.meta.env.VITE_REVERB_PORT || import.meta.env.VITE_PUSHER_PORT || 8080,
        forceTLS: (import.meta.env.VITE_REVERB_SCHEME || import.meta.env.VITE_PUSHER_SCHEME) === 'https',
        enabledTransports: ['ws', 'wss'],
        authEndpoint: '/api/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: 'application/json',
            },
        },
    });
};

// Singleton storage of connection instance
let echoInstance = null;

export const getEcho = () => {
    if (!echoInstance) {
        const { useAuthStore } = require('../store/authStore');
        const token = useAuthStore.getState().token;
        echoInstance = initializeEcho(token);
    }
    return echoInstance;
};

export const resetEcho = () => {
    if (echoInstance) {
        echoInstance.disconnect();
        echoInstance = null;
    }
};

