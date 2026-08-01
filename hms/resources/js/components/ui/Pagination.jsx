import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const Pagination = ({ 
    currentPage, 
    lastPage, 
    onPageChange 
}) => {
    if (lastPage <= 1) return null;

    return (
        <div className="flex items-center justify-between px-6 py-4 bg-white border-t border-slate-100 mt-4 rounded-b-2xl shadow-sm">
            <div className="text-sm text-slate-500">
                Page <span className="font-semibold text-slate-700">{currentPage}</span> of{' '}
                <span className="font-semibold text-slate-700">{lastPage}</span>
            </div>

            <div className="inline-flex gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronLeft className="w-5 h-5 text-slate-600" />
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === lastPage}
                    className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                    <ChevronRight className="w-5 h-5 text-slate-600" />
                </button>
            </div>
        </div>
    );
};
