import React from 'react';

export const Input = React.forwardRef(({ 
    label, 
    type = 'text', 
    error, 
    placeholder, 
    className = '',
    ...props 
}, ref) => {
    return (
        <div className="space-y-1.5 w-full">
            {label && (
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {label}
                </label>
            )}
            <input
                type={type}
                ref={ref}
                placeholder={placeholder}
                className={`block w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all ${
                    error ? 'border-red-500/50 focus:ring-red-500' : 'focus:border-sky-500'
                } ${className}`}
                {...props}
            />
            {error && (
                <p className="text-xs text-red-500 font-medium">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';
