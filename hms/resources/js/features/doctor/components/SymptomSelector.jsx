import React, { useState, useEffect, useRef } from 'react';
import { symptomsApi } from '../../../api/symptoms';
import { Search, Plus, X } from 'lucide-react';

export const SymptomSelector = ({ selectedSymptoms, setSelectedSymptoms, customSymptoms, setCustomSymptoms }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const search = async () => {
            if (!query.trim()) {
                setResults([]);
                return;
            }
            setLoading(true);
            try {
                const data = await symptomsApi.search(query);
                setResults(data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(search, 300);
        return () => clearTimeout(timer);
    }, [query]);

    const handleSelect = (symptom) => {
        if (!selectedSymptoms.find(s => s.id === symptom.id)) {
            setSelectedSymptoms([...selectedSymptoms, symptom]);
        }
        setQuery('');
        setIsOpen(false);
    };

    const handleRemove = (id) => {
        setSelectedSymptoms(selectedSymptoms.filter(s => s.id !== id));
    };

    const handleCreateNew = async () => {
        if (!query.trim()) return;
        try {
            const res = await symptomsApi.create(query.trim());
            const newSymptom = res.data;
            handleSelect(newSymptom);
        } catch (err) {
            // If already exists or error, just append to custom for safety or alert
            console.error(err);
            alert("Failed to create symptom. It may already exist.");
        }
    };

    return (
        <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
                Symptoms <span className="text-red-500">*</span>
            </label>
            
            {/* Selected Pills */}
            {selectedSymptoms.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedSymptoms.map(s => (
                        <div key={s.id} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm font-medium border border-indigo-100">
                            {s.name}
                            <button type="button" onClick={() => handleRemove(s.id)} className="p-0.5 hover:bg-indigo-200 rounded-full">
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Search Input */}
            <div className="relative" ref={wrapperRef}>
                <div className="relative flex items-center">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value);
                            setIsOpen(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateNew();
                            }
                        }}
                        onFocus={() => setIsOpen(true)}
                        placeholder="Search symptoms (e.g. fever)..."
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50"
                    />
                </div>

                {isOpen && query.trim() && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {loading ? (
                            <div className="p-3 text-sm text-gray-500 text-center">Searching...</div>
                        ) : results.length > 0 ? (
                            <ul className="py-1">
                                {results.map((symptom) => (
                                    <li
                                        key={symptom.id}
                                        onClick={() => handleSelect(symptom)}
                                        className="px-4 py-2 hover:bg-indigo-50 cursor-pointer text-sm text-gray-700 flex items-center"
                                    >
                                        {symptom.name}
                                    </li>
                                ))}
                                <li className="border-t border-gray-100 mt-1" />
                                <li
                                    onClick={handleCreateNew}
                                    className="px-4 py-2 hover:bg-green-50 cursor-pointer text-sm text-green-700 font-medium flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" /> Add "{query}" as new symptom
                                </li>
                            </ul>
                        ) : (
                            <div className="p-2">
                                <div className="text-sm text-gray-500 text-center mb-2">No existing symptoms found.</div>
                                <button
                                    type="button"
                                    onClick={handleCreateNew}
                                    className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors"
                                >
                                    <Plus className="w-4 h-4" /> Create "{query}"
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Custom Notes */}
            <div>
                <input
                    type="text"
                    value={customSymptoms}
                    onChange={(e) => setCustomSymptoms(e.target.value)}
                    placeholder="Additional custom symptoms notes (optional)..."
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50/50"
                />
            </div>
        </div>
    );
};
