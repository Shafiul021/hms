import React from 'react';

export const Skeleton = ({ 
    variant = 'text', 
    width = 'w-full', 
    height = 'h-4', 
    className = '' 
}) => {
    const baseStyle = 'animate-pulse bg-slate-200';
    
    const shapes = {
        text: 'rounded-md',
        circle: 'rounded-full',
        rect: 'rounded-xl',
    };

    return (
        <div className={`${baseStyle} ${shapes[variant]} ${width} ${height} ${className}`} />
    );
};

export const TableSkeleton = ({ rows = 5, cols = 4 }) => {
    return (
        <div className="space-y-4 w-full">
            {Array.from({ length: rows }).map((_, rIdx) => (
                <div key={rIdx} className="flex gap-4 p-4 border border-slate-100 bg-white rounded-xl shadow-sm">
                    {Array.from({ length: cols }).map((_, cIdx) => (
                        <Skeleton 
                            key={cIdx} 
                            variant="text" 
                            width={cIdx === 0 ? 'w-1/4' : 'w-1/6'} 
                            height="h-5" 
                        />
                    ))}
                </div>
            ))}
        </div>
    );
};
