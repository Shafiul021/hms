import React from 'react';

export const Button = ({ 
    children, 
    type = 'button', 
    variant = 'primary', 
    size = 'md', 
    loading = false,
    isLoading = false,
    disabled = false, 
    icon = null,
    onClick,
    className = '',
    'aria-label': ariaLabel,
    ...props 
}) => {
    const isSpinning = loading || isLoading;

    const baseStyle = [
        'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all',
        // Visible focus ring for keyboard navigation
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500',
        'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] cursor-pointer',
    ].join(' ');
    
    const variants = {
        primary:   'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-md shadow-sky-500/10 border border-transparent',
        secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200',
        danger:    'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-500/10 border border-transparent focus-visible:ring-red-500',
        outline:   'border border-slate-200 hover:bg-slate-50 text-slate-700 bg-transparent',
        ghost:     'bg-transparent hover:bg-gray-100 text-gray-600 border border-transparent',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2.5 text-sm',
        lg: 'px-6 py-3.5 text-base',
    };

    return (
        <button
            type={type}
            disabled={disabled || isSpinning}
            onClick={onClick}
            aria-label={ariaLabel}
            aria-busy={isSpinning || undefined}
            aria-disabled={disabled || isSpinning || undefined}
            className={`${baseStyle} ${variants[variant] ?? variants.primary} ${sizes[size] ?? sizes.md} ${className}`}
            {...props}
        >
            {isSpinning ? (
                <>
                    <svg
                        className="animate-spin h-4 w-4 text-current flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Loading...</span>
                </>
            ) : (
                <>
                    {icon && <span className="flex-shrink-0" aria-hidden="true">{icon}</span>}
                    {children}
                </>
            )}
        </button>
    );
};
