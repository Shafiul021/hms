import React from 'react';

/**
 * PatientCodeChip — displays a patient's unique HMS code as a styled chip.
 * Optionally shows the patient's name alongside the code.
 *
 * Usage:
 *   <PatientCodeChip code="HMS-00123" />
 *   <PatientCodeChip code="HMS-00123" name="John Doe" />
 *   <PatientCodeChip code="HMS-00123" name="John Doe" onClick={() => navigate(...)} />
 */

const PatientCodeChip = ({ code, name, onClick, size = 'sm', className = '' }) => {
    const sizeClasses = {
        xs: 'text-xs px-2 py-0.5 gap-1',
        sm: 'text-xs px-2.5 py-1 gap-1.5',
        md: 'text-sm px-3 py-1.5 gap-2',
    };

    const Tag = onClick ? 'button' : 'span';

    return (
        <Tag
            onClick={onClick}
            type={onClick ? 'button' : undefined}
            className={[
                'inline-flex items-center rounded-md font-mono font-semibold',
                'bg-indigo-50 text-indigo-700 border border-indigo-200',
                'ring-1 ring-inset ring-indigo-300/50',
                sizeClasses[size] || sizeClasses.sm,
                onClick
                    ? 'cursor-pointer hover:bg-indigo-100 hover:border-indigo-400 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1'
                    : '',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            {/* Patient icon */}
            <svg
                className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'}
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
            >
                <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                />
            </svg>

            <span>{code}</span>

            {name && (
                <>
                    <span className="text-indigo-300 select-none">·</span>
                    <span className="font-sans font-normal text-indigo-600 truncate max-w-[120px]">
                        {name}
                    </span>
                </>
            )}
        </Tag>
    );
};

export default PatientCodeChip;
