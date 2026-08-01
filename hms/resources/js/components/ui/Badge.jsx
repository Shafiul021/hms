import React from 'react';

export const Badge = ({ 
    children, 
    variant = 'info', 
    className = '' 
}) => {
    const baseStyle = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider';
    
    const variants = {
        success: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        danger: 'bg-rose-50 text-rose-700 border border-rose-100',
        warning: 'bg-amber-50 text-amber-700 border border-amber-100',
        info: 'bg-sky-50 text-sky-700 border border-sky-100',
        neutral: 'bg-slate-50 text-slate-600 border border-slate-100',
    };

    return (
        <span className={`${baseStyle} ${variants[variant]} ${className}`}>
            {children}
        </span>
    );
};
