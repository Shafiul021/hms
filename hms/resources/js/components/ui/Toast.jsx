import React, { useEffect, useId } from 'react';
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react';

export const Toast = ({ 
    message, 
    type = 'success', 
    onClose, 
    duration = 4000 
}) => {
    const toastId = useId();

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const icons = {
        success: <CheckCircle className="w-5 h-5 text-emerald-500" aria-hidden="true" />,
        error:   <AlertCircle className="w-5 h-5 text-rose-500"    aria-hidden="true" />,
        info:    <Info        className="w-5 h-5 text-sky-500"     aria-hidden="true" />,
    };

    const colors = {
        success: 'bg-[#f0fdf4] border-emerald-100 text-slate-800',
        error:   'bg-[#fff5f5] border-rose-100 text-slate-800',
        info:    'bg-[#f0f9ff] border-sky-100 text-slate-800',
    };

    // success/info → polite (non-interrupting), error → assertive (interrupting)
    const liveRegion = type === 'error' ? 'assertive' : 'polite';

    return (
        <div
            id={toastId}
            role="status"
            aria-live={liveRegion}
            aria-atomic="true"
            className={`fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3.5 border rounded-xl shadow-xl transition-all duration-300 max-w-sm animate-slideIn ${colors[type]}`}
        >
            <span className="shrink-0">{icons[type]}</span>
            <span className="text-sm font-medium flex-1">{message}</span>
            <button 
                onClick={onClose}
                aria-label="Dismiss notification"
                className="p-1 hover:bg-slate-100/50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
                <X className="w-4 h-4" aria-hidden="true" />
            </button>
        </div>
    );
};
