import React from 'react';

/**
 * StatusBadge — maps appointment/IPD/lab statuses to color-coded badges.
 * Understands Spatie-style role slugs and domain statuses.
 *
 * Usage:
 *   <StatusBadge status="confirmed" />
 *   <StatusBadge status="admin" type="role" />
 */

const STATUS_MAP = {
    // Appointment statuses
    scheduled:   { label: 'Scheduled',   bg: 'bg-blue-100',    text: 'text-blue-800',    dot: 'bg-blue-500'    },
    confirmed:   { label: 'Confirmed',   bg: 'bg-green-100',   text: 'text-green-800',   dot: 'bg-green-500'   },
    in_progress: { label: 'In Progress', bg: 'bg-sky-100',     text: 'text-sky-800',     dot: 'bg-sky-500'     },
    completed:   { label: 'Completed',   bg: 'bg-emerald-100', text: 'text-emerald-800', dot: 'bg-emerald-500' },
    cancelled:   { label: 'Cancelled',   bg: 'bg-red-100',     text: 'text-red-700',     dot: 'bg-red-500'     },
    no_show:     { label: 'No Show',     bg: 'bg-orange-100',  text: 'text-orange-800',  dot: 'bg-orange-500'  },
    delayed:     { label: 'Delayed',     bg: 'bg-yellow-100',  text: 'text-yellow-800',  dot: 'bg-yellow-500'  },
    missed:      { label: 'Missed',      bg: 'bg-gray-200',    text: 'text-gray-700',    dot: 'bg-gray-500'    },
    rescheduled: { label: 'Rescheduled', bg: 'bg-purple-100',  text: 'text-purple-800',  dot: 'bg-purple-500'  },

    // IPD statuses
    admitted:    { label: 'Admitted',    bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
    discharged:  { label: 'Discharged', bg: 'bg-teal-100',   text: 'text-teal-700',   dot: 'bg-teal-500'   },
    transferred: { label: 'Transferred',bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },

    // Lab statuses
    pending:     { label: 'Pending',    bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' },
    requested:   { label: 'Requested', bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500'  },
    processing:  { label: 'Processing',bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
    resulted:    { label: 'Resulted',  bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },

    // Billing statuses
    paid:        { label: 'Paid',        bg: 'bg-green-100',  text: 'text-green-800',  dot: 'bg-green-500'  },
    unpaid:      { label: 'Unpaid',      bg: 'bg-red-100',    text: 'text-red-700',    dot: 'bg-red-500'    },
    partial:     { label: 'Partial',     bg: 'bg-orange-100', text: 'text-orange-800', dot: 'bg-orange-500' },
    waived:      { label: 'Waived',      bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },

    // Pharmacy
    dispensed:    { label: 'Dispensed',    bg: 'bg-teal-100', text: 'text-teal-700', dot: 'bg-teal-500'  },
    out_of_stock: { label: 'Out of Stock', bg: 'bg-red-100',  text: 'text-red-700',  dot: 'bg-red-500'   },
};

const ROLE_MAP = {
    admin:        { label: 'Admin',       bg: 'bg-purple-100', text: 'text-purple-800', dot: 'bg-purple-500' },
    doctor:       { label: 'Doctor',      bg: 'bg-blue-100',   text: 'text-blue-800',   dot: 'bg-blue-500'   },
    nurse:        { label: 'Nurse',       bg: 'bg-pink-100',   text: 'text-pink-700',   dot: 'bg-pink-500'   },
    receptionist: { label: 'Receptionist',bg:'bg-cyan-100',    text: 'text-cyan-700',   dot: 'bg-cyan-500'   },
    pharmacist:   { label: 'Pharmacist',  bg: 'bg-lime-100',   text: 'text-lime-700',   dot: 'bg-lime-500'   },
    lab_technician:{ label: 'Lab Tech',  bg: 'bg-amber-100',  text: 'text-amber-800',  dot: 'bg-amber-500'  },
    accountant:   { label: 'Accountant', bg: 'bg-indigo-100', text: 'text-indigo-800', dot: 'bg-indigo-500' },
};

const DEFAULT_CONFIG = {
    label: 'Unknown',
    bg: 'bg-gray-100',
    text: 'text-gray-600',
    dot: 'bg-gray-400',
};

const StatusBadge = ({ status, type = 'status', showDot = true, size = 'sm', className = '' }) => {
    const map = type === 'role' ? ROLE_MAP : STATUS_MAP;
    const key = String(status || '').toLowerCase().replace(/-/g, '_');
    const config = map[key] || { ...DEFAULT_CONFIG, label: status || 'Unknown' };

    const sizeClasses = {
        xs: 'px-1.5 py-0.5 text-xs',
        sm: 'px-2.5 py-0.5 text-xs',
        md: 'px-3 py-1 text-sm',
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 font-medium rounded-full ${config.bg} ${config.text} ${sizeClasses[size] || sizeClasses.sm} ${className}`}
        >
            {showDot && (
                <span className={`w-1.5 h-1.5 rounded-full ${config.dot} flex-shrink-0`} />
            )}
            {config.label}
        </span>
    );
};

export default StatusBadge;
