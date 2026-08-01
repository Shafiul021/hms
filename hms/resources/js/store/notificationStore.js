import { create } from 'zustand';

export const useNotificationStore = create((set, get) => ({
    notifications: [],
    unreadCount: 0,

    add: (notification) => {
        const newNotification = {
            id: notification.id || Date.now().toString(),
            message: notification.message,
            type: notification.type || 'info',
            read: false,
            createdAt: new Date().toISOString(),
            link: notification.link || null,
        };

        set((state) => {
            const notifications = [newNotification, ...state.notifications];
            return {
                notifications,
                unreadCount: notifications.filter(n => !n.read).length
            };
        });
    },

    markRead: (id) => {
        set((state) => {
            const notifications = state.notifications.map((n) =>
                n.id === id ? { ...n, read: true } : n
            );
            return {
                notifications,
                unreadCount: notifications.filter(n => !n.read).length
            };
        });
    },

    markAllRead: () => {
        set((state) => {
            const notifications = state.notifications.map((n) => ({ ...n, read: true }));
            return {
                notifications,
                unreadCount: 0
            };
        });
    },

    clear: () => set({ notifications: [], unreadCount: 0 }),
}));
