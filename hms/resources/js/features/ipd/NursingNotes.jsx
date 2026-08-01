import React, { useState, useEffect } from 'react';
import { ipdApi } from '../../api/ipd';
import { Button } from '../../components/ui/Button';
import { Toast } from '../../components/ui/Toast';
import { formatDate } from '../../utils/formatDate';
import { FileText, Plus, User } from 'lucide-react';

export const NursingNotes = ({ admissionId }) => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newNote, setNewNote] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [toasts, setToasts] = useState([]);

    const fetchNotes = async () => {
        try {
            const data = await ipdApi.getNursingNotes(admissionId);
            setNotes(data.data || data);
        } catch (err) {
            addToast('Failed to load nursing notes.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (admissionId) {
            fetchNotes();
        }
    }, [admissionId]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newNote.trim()) return;

        setSubmitting(true);
        try {
            await ipdApi.addNursingNote(admissionId, newNote);
            setNewNote('');
            addToast('Nursing note added successfully!');
            fetchNotes();
        } catch (err) {
            addToast('Failed to add note.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-6 w-32 bg-gray-200 rounded" />
                <div className="h-24 bg-gray-100 rounded-2xl" />
                <div className="h-24 bg-gray-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                <FileText className="w-5 h-5 text-indigo-500" />
                Chronological Nursing Notes
            </h3>

            {/* Note list */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {notes.length === 0 ? (
                    <p className="text-sm text-gray-400 italic text-center py-6">
                        No nursing notes recorded yet for this admission.
                    </p>
                ) : (
                    notes.map((note) => (
                        <div key={note.id} className="p-4 bg-gray-50 border border-gray-100 rounded-2xl space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-400">
                                <span className="flex items-center gap-1 font-semibold text-gray-600">
                                    <User className="w-3.5 h-3.5" />
                                    Nurse / Staff
                                </span>
                                <span>{formatDate(note.created_at)}</span>
                            </div>
                            <p className="text-sm text-gray-700 leading-relaxed white-space-pre-wrap">
                                {note.note}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Add note Form */}
            <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-4 space-y-3">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Add Nursing Observation</label>
                    <textarea
                        rows={3}
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Enter patient vitals, changes in condition, medications administered, clinical logs..."
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 bg-gray-50 resize-none"
                        required
                    />
                </div>
                <div className="flex justify-end">
                    <Button type="submit" loading={submitting} icon={<Plus className="w-4 h-4" />}>
                        Add Note
                    </Button>
                </div>
            </form>

            {/* Toasts */}
            <div className="fixed bottom-4 right-4 z-50 space-y-2">
                {toasts.map((toast) => (
                    <Toast
                        key={toast.id}
                        message={toast.message}
                        type={toast.type}
                        onClose={() => removeToast(toast.id)}
                    />
                ))}
            </div>
        </div>
    );
};
