import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    size = 'md',
    id,
}) => {
    const titleId  = id ? `${id}-title`  : 'modal-title';
    const panelRef = useRef(null);

    // ── Close on Escape ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [isOpen, onClose]);

    // ── Trap focus inside modal ──────────────────────────────────────────────
    useEffect(() => {
        if (!isOpen || !panelRef.current) return;

        const focusable = panelRef.current.querySelectorAll(
            'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        // Focus first element on open
        first?.focus();

        const handleTab = (e) => {
            if (e.key !== 'Tab') return;
            if (e.shiftKey) {
                if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
            } else {
                if (document.activeElement === last)  { e.preventDefault(); first?.focus(); }
            }
        };

        document.addEventListener('keydown', handleTab);
        return () => document.removeEventListener('keydown', handleTab);
    }, [isOpen]);

    // ── Lock body scroll ─────────────────────────────────────────────────────
    useEffect(() => {
        if (isOpen) { document.body.style.overflow = 'hidden'; }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-5xl',
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
        >
            {/* Backdrop */}
            <div 
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Content Container */}
            <div
                ref={panelRef}
                className={`relative w-full ${sizes[size]} bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden transform transition-all animate-scaleUp`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h3 id={titleId} className="font-semibold text-lg text-slate-800">
                        {title}
                    </h3>
                    <button 
                        onClick={onClose}
                        aria-label="Close dialog"
                        className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                    >
                        <X className="w-5 h-5" aria-hidden="true" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};
