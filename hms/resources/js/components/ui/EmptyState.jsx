import React from 'react';
import { Inbox } from 'lucide-react';

export const EmptyState = ({
    title = 'No records found',
    description = 'Try adjusting your filters or adding a new record.',
    icon,
    action,
    children,
}) => {
    // icon can be passed as a JSX element <Icon /> or a component reference Icon
    const renderIcon = () => {
        if (!icon) return <Inbox className="w-8 h-8" />;
        // If it's a valid React element (JSX), render it directly
        if (React.isValidElement(icon)) return icon;
        // If it's a component reference, render it as a component
        const Icon = icon;
        return <Icon className="w-8 h-8" />;
    };

    return (
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white border border-slate-100 rounded-2xl shadow-sm">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100/50 mb-4 text-slate-400">
                {renderIcon()}
            </div>
            <h4 className="font-semibold text-base text-slate-800 mb-1">{title}</h4>
            <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>
            {action && <div className="mt-2">{action}</div>}
            {children}
        </div>
    );
};

