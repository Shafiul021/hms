import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus } from 'lucide-react';

export const MedicineSelector = ({ medicines, valueId, valueName, onChangeId, onChangeName }) => {
    const [query, setQuery] = useState(valueName || '');
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
                // If they didn't select an ID and typed something, keep it as free text
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Keep query synced with external changes
    useEffect(() => {
        if (!isOpen) {
            const med = medicines.find(m => m.id === valueId);
            if (med) setQuery(med.name);
            else setQuery(valueName || '');
        }
    }, [valueId, valueName, medicines, isOpen]);

    const filtered = query === '' 
        ? medicines.slice(0, 50) 
        : medicines.filter(m => m.name.toLowerCase().includes(query.toLowerCase())).slice(0, 50);

    const handleSelect = (med) => {
        onChangeId(med.id);
        onChangeName(med.name);
        setQuery(med.name);
        setIsOpen(false);
    };

    const handleCustomInput = (e) => {
        setQuery(e.target.value);
        onChangeId(''); // Clear ID since it's custom
        onChangeName(e.target.value);
        if (!isOpen) setIsOpen(true);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                <input
                    type="text"
                    value={query}
                    onChange={handleCustomInput}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Search or type new medicine name..."
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-white"
                />
            </div>

            {isOpen && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {filtered.length > 0 ? (
                        <ul className="py-1">
                            {filtered.map((med) => (
                                <li
                                    key={med.id}
                                    onClick={() => handleSelect(med)}
                                    className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700 flex flex-col"
                                >
                                    <span className="font-medium">{med.name}</span>
                                    {med.generic_name && <span className="text-xs text-gray-400">{med.generic_name}</span>}
                                </li>
                            ))}
                            {query.trim() && !filtered.find(m => m.name.toLowerCase() === query.trim().toLowerCase()) && (
                                <>
                                    <li className="border-t border-gray-100 mt-1" />
                                    <li
                                        onClick={() => setIsOpen(false)}
                                        className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm text-green-700 font-medium flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Use "{query}" as new medicine
                                    </li>
                                </>
                            )}
                        </ul>
                    ) : (
                        <div className="p-2">
                            <div className="text-sm text-gray-500 text-center mb-2">No existing medicine found.</div>
                            {query.trim() && (
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Use "{query}" as new medicine
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
