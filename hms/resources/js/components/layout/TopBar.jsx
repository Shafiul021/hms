import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { Bell, LogOut, User, Check, CheckCheck, Inbox, ExternalLink } from 'lucide-react';
import { authApi } from '../../api/auth';
import { useNavigate, Link } from 'react-router-dom';

// ── Notification type → colour mapping ────────────────────────────────────────
const TYPE_STYLES = {
    info:    'bg-indigo-500',
    warning: 'bg-amber-500',
    success: 'bg-emerald-500',
    error:   'bg-rose-500',
};

// ── Single Notification Item ────────────────────────────────────────────────
const NotificationItem = ({ notification, onMarkRead }) => {
    const dot = TYPE_STYLES[notification.type] ?? 'bg-slate-400';
    return (
        <div
            className={`px-4 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                !notification.read ? 'bg-indigo-50/30' : ''
            }`}
        >
            {/* Coloured indicator dot */}
            <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${dot} ${notification.read ? 'opacity-30' : ''}`} />
            <div className="flex-1 min-w-0">
                {notification.link ? (
                    <Link
                        to={notification.link}
                        className="text-xs text-slate-700 font-medium leading-snug hover:text-indigo-600 transition-colors line-clamp-2 flex items-center gap-1"
                        onClick={() => onMarkRead(notification.id)}
                    >
                        {notification.message}
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </Link>
                ) : (
                    <p className="text-xs text-slate-700 font-medium leading-snug line-clamp-2">
                        {notification.message}
                    </p>
                )}
                <span className="text-xs text-slate-400 mt-0.5 block">
                    {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
            {!notification.read && (
                <button
                    onClick={() => onMarkRead(notification.id)}
                    title="Mark read"
                    className="flex-shrink-0 p-1 text-slate-300 hover:text-indigo-500 rounded transition-colors"
                >
                    <Check className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
};

export const TopBar = () => {
    const { user, logout } = useAuthStore();
    const { unreadCount, notifications, markRead, markAllRead } = useNotificationStore();
    const navigate = useNavigate();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = async () => {
        try {
            await authApi.logout();
        } catch (e) {
            console.error('Logout request failed:', e);
        } finally {
            logout();
            navigate('/login');
        }
    };

    const handleBellClick = () => {
        setDropdownOpen(prev => !prev);
    };

    return (
        <header className="h-16 border-b border-[#e2e8f0] bg-white sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between shadow-sm">
            {/* Spacer on mobile to avoid hamburger overlap */}
            <h1 className="text-base md:text-xl font-semibold text-gray-800 pl-10 md:pl-0 truncate">
                Hospital Portal
            </h1>

            <div className="flex items-center gap-2 md:gap-4">
                {/* ── Notifications Bell ─────────────────────────────────── */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        id="notification-bell-btn"
                        onClick={handleBellClick}
                        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                        aria-expanded={dropdownOpen}
                        aria-haspopup="true"
                        aria-controls="notification-dropdown"
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl relative transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                    >
                        <Bell className="w-5 h-5" aria-hidden="true" />
                        {unreadCount > 0 && (
                            <span
                                aria-hidden="true"
                                className="absolute top-1 right-1 bg-rose-500 text-white text-[11px] font-bold min-w-[16px] h-4 rounded-full flex items-center justify-center px-0.5 animate-pulse border-2 border-white leading-none"
                            >
                                {unreadCount > 99 ? '99+' : unreadCount}
                            </span>
                        )}
                    </button>

                    {/* ── Dropdown Panel ─────────────────────────────────── */}
                    {dropdownOpen && (
                        <div
                            id="notification-dropdown"
                            role="region"
                            aria-label="Notifications panel"
                            className="absolute right-0 mt-2 w-80 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                                <span className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-indigo-500" /> Notifications
                                    {unreadCount > 0 && (
                                        <span className="bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full">
                                            {unreadCount}
                                        </span>
                                    )}
                                </span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        aria-label="Mark all notifications as read"
                                        className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" /> All read
                                    </button>
                                )}
                            </div>

                            {/* Notification list */}
                            <div className="max-h-72 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-400 gap-2">
                                        <Inbox className="w-7 h-7 text-slate-300" />
                                        <p className="text-xs font-medium">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.slice(0, 20).map(n => (
                                        <NotificationItem
                                            key={n.id}
                                            notification={n}
                                            onMarkRead={(id) => {
                                                markRead(id);
                                                setDropdownOpen(false);
                                            }}
                                        />
                                    ))
                                )}
                            </div>

                            {/* Footer */}
                            {notifications.length > 0 && (
                                <div className="border-t border-slate-100 px-4 py-2.5 text-center">
                                    <button
                                        onClick={() => {
                                            markAllRead();
                                            setDropdownOpen(false);
                                        }}
                                        aria-label="Clear all notifications"
                                        className="text-xs text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                                    >
                                        Clear all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── User Profile ───────────────────────────────────────── */}
                <div className="flex items-center gap-2 md:gap-3 border-l border-gray-200 pl-2 md:pl-4">
                    <div className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                        <User className="w-4 h-4" />
                    </div>
                    <div className="hidden md:block">
                        <p className="text-sm font-semibold text-gray-700 truncate max-w-[120px]">{user?.name}</p>
                        <p className="text-xs font-medium text-slate-500 capitalize">
                            {user?.roles?.[0]?.name || user?.role || 'Guest'}
                        </p>
                    </div>

                    {/* Logout */}
                    <button
                        id="logout-btn"
                        onClick={handleLogout}
                        aria-label="Sign out"
                        className="p-2 ml-1 text-slate-400 hover:text-rose-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                    >
                        <LogOut className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </header>
    );
};
