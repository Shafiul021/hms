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
        <header className="h-[72px] bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between shadow-sm transition-all duration-300">
            {/* Left Side: Title */}
            <div className="flex items-center gap-4 pl-10 md:pl-0">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">
                        Hospital Portal
                    </h1>
                    <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase hidden sm:block mt-0.5">
                        Advanced Medical System
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-3 md:gap-5">
                {/* ── Notifications Bell ─────────────────────────────────── */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        id="notification-bell-btn"
                        onClick={handleBellClick}
                        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                        aria-expanded={dropdownOpen}
                        aria-haspopup="true"
                        aria-controls="notification-dropdown"
                        className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl relative transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 hover:shadow-sm"
                    >
                        <Bell className="w-5 h-5" aria-hidden="true" />
                        {unreadCount > 0 && (
                            <span
                                aria-hidden="true"
                                className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 animate-pulse border-2 border-white leading-none shadow-sm shadow-rose-500/30"
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
                            className="absolute right-0 mt-3 w-[340px] bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl shadow-indigo-500/10 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                                <span className="font-bold text-sm text-slate-800 flex items-center gap-2 tracking-tight">
                                    <Bell className="w-4 h-4 text-indigo-500" /> Notifications
                                    {unreadCount > 0 && (
                                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {unreadCount}
                                        </span>
                                    )}
                                </span>
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        aria-label="Mark all notifications as read"
                                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-1.5 py-1 hover:bg-indigo-50"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" aria-hidden="true" /> All read
                                    </button>
                                )}
                            </div>

                            {/* Notification list */}
                            <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                                            <Inbox className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-sm font-medium text-slate-500">You're all caught up!</p>
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
                                <div className="border-t border-slate-100 px-5 py-3 text-center bg-slate-50/50 hover:bg-slate-50 transition-colors">
                                    <button
                                        onClick={() => {
                                            markAllRead();
                                            setDropdownOpen(false);
                                        }}
                                        aria-label="Clear all notifications"
                                        className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded px-2 py-1"
                                    >
                                        Clear all notifications
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* ── User Profile ───────────────────────────────────────── */}
                <div className="flex items-center gap-3 md:gap-5 pl-4 md:pl-6 border-l border-slate-200/60">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold text-sm">
                                {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="hidden md:flex flex-col">
                            <span className="text-sm font-bold text-slate-800 leading-tight tracking-tight max-w-[130px] truncate">{user?.name}</span>
                            <span className="text-[11px] font-semibold text-indigo-600 capitalize leading-tight mt-0.5">
                                {user?.roles?.[0]?.name || user?.role || 'Guest'}
                            </span>
                        </div>
                    </div>

                    {/* Logout */}
                    <button
                        id="logout-btn"
                        onClick={handleLogout}
                        aria-label="Sign out"
                        className="p-2.5 ml-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:shadow-sm rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 group"
                        title="Sign out"
                    >
                        <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" aria-hidden="true" />
                    </button>
                </div>
            </div>
        </header>
    );
};
