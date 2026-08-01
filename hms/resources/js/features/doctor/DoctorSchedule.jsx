import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { doctorsApi } from '../../api/doctors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Toast } from '../../components/ui/Toast';
import { 
    Calendar, 
    Clock, 
    Plus, 
    Trash2, 
    Save, 
    Check, 
    Lock, 
    Unlock 
} from 'lucide-react';

const DAYS_OF_WEEK = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
];

export const DoctorSchedule = () => {
    const { user } = useAuthStore();
    const doctorId = user?.doctor?.id || user?.id; // Fallback helper

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [schedules, setSchedules] = useState([]);
    const [toasts, setToasts] = useState([]);

    // Temporary inputs for adding slots
    const [selectedDay, setSelectedDay] = useState(1); // Default to Monday
    const [newStart, setNewStart] = useState('09:00');
    const [newEnd, setNewEnd] = useState('13:00');

    useEffect(() => {
        if (!doctorId) return;
        doctorsApi
            .getDoctor(doctorId)
            .then((data) => {
                const doc = data.data || data;
                // Parse existing schedules or init blank
                const rawSchedules = doc.schedules || [];
                
                // Map day 0-6 to list
                const mapped = DAYS_OF_WEEK.map((day) => {
                    const found = rawSchedules.find((s) => s.day_of_week === day.value);
                    return {
                        day_of_week: day.value,
                        label: day.label,
                        is_active: found ? !!found.is_active : false,
                        slots: found?.slots || [],
                    };
                });
                setSchedules(mapped);
            })
            .catch(() => addToast('Failed to load schedule.', 'error'))
            .finally(() => setLoading(false));
    }, [doctorId]);

    const addToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);
    };

    const removeToast = (id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    // Toggle active state for a day
    const toggleDay = (dayIndex) => {
        setSchedules((prev) =>
            prev.map((s) =>
                s.day_of_week === dayIndex ? { ...s, is_active: !s.is_active } : s
            )
        );
    };

    // Toggle blocked status for a slot
    const toggleSlotBlock = (dayIndex, slotId) => {
        setSchedules((prev) =>
            prev.map((s) => {
                if (s.day_of_week !== dayIndex) return s;
                return {
                    ...s,
                    slots: s.slots.map((slot) =>
                        slot.id === slotId ? { ...slot, is_blocked: !slot.is_blocked } : slot
                    ),
                };
            })
        );
    };

    // Add new slot
    const handleAddSlot = (e) => {
        e.preventDefault();
        if (!newStart || !newEnd) return;

        // format to H:i:s
        const startTime = `${newStart}:00`;
        const endTime = `${newEnd}:00`;

        setSchedules((prev) =>
            prev.map((s) => {
                if (s.day_of_week !== selectedDay) return s;
                // Make day active if a slot is added
                return {
                    ...s,
                    is_active: true,
                    slots: [
                        ...s.slots,
                        {
                            start_time: startTime,
                            end_time: endTime,
                            is_blocked: false
                        }
                    ]
                };
            })
        );

        addToast(`Slot ${newStart} - ${newEnd} added to ${DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label}.`);
    };

    // Save Schedule
    const handleSaveSchedule = async () => {
        setSaving(true);
        try {
            // Prepare payload
            const payload = {
                schedules: schedules.map((s) => ({
                    day_of_week: s.day_of_week,
                    is_active: s.is_active,
                    slots: s.slots.map((slot) => {
                        const parsed = {
                            start_time: slot.start_time,
                            end_time: slot.end_time,
                            is_blocked: !!slot.is_blocked,
                        };
                        if (slot.id) {
                            parsed.id = slot.id;
                        }
                        return parsed;
                    }),
                })),
            };

            await doctorsApi.updateSchedule(doctorId, payload);
            addToast('Schedule updated successfully!');
        } catch (err) {
            addToast(err?.response?.data?.message || 'Failed to save schedule.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-6 space-y-6 max-w-5xl mx-auto">
                <div className="h-8 w-48 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="w-6 h-6 text-indigo-500" />
                        My Work Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Set working days, adjust timings, and block/unblock slots.
                    </p>
                </div>
                <Button onClick={handleSaveSchedule} loading={saving} icon={<Save className="w-4 h-4" />}>
                    Save Changes
                </Button>
            </div>

            {/* Layout grids */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Left: Day Grid List */}
                <div className="lg:col-span-8 space-y-4">
                    {schedules.map((day) => (
                        <div 
                            key={day.day_of_week} 
                            className={`p-5 rounded-2xl border transition-all duration-200 bg-white ${
                                day.is_active 
                                    ? 'border-indigo-150 shadow-sm' 
                                    : 'border-gray-200 opacity-70'
                            }`}
                        >
                            {/* Row Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-3">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={day.is_active}
                                        onChange={() => toggleDay(day.day_of_week)}
                                        className="h-4.5 w-4.5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span className={`text-base font-bold ${day.is_active ? 'text-gray-900' : 'text-gray-400'}`}>
                                        {day.label}
                                    </span>
                                </div>
                                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                                    day.is_active 
                                        ? 'bg-green-50 border border-green-200 text-green-700' 
                                        : 'bg-gray-100 text-gray-500'
                                }`}>
                                    {day.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </div>

                            {/* Time Slots Grid */}
                            {day.is_active && (
                                <div className="flex flex-wrap gap-2.5">
                                    {day.slots.length === 0 ? (
                                        <p className="text-sm text-gray-400 italic">No time slots configured. Add some on the right.</p>
                                    ) : (
                                        day.slots.map((slot, idx) => {
                                            const timeDisplay = `${slot.start_time.substring(0, 5)} - ${slot.end_time.substring(0, 5)}`;
                                            return (
                                                <button
                                                    key={slot.id || idx}
                                                    onClick={() => slot.id && toggleSlotBlock(day.day_of_week, slot.id)}
                                                    type="button"
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all duration-150 ${
                                                        slot.is_blocked
                                                            ? 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
                                                            : 'bg-indigo-50/50 border-indigo-150 text-indigo-700 hover:bg-indigo-100/50'
                                                    }`}
                                                >
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <span>{timeDisplay}</span>
                                                    {slot.is_blocked ? (
                                                        <Lock className="w-3 h-3 text-red-500 ml-0.5" />
                                                    ) : (
                                                        <Unlock className="w-3 h-3 text-indigo-400 ml-0.5" />
                                                    )}
                                                </button>
                                            );
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Right: Quick Add Slot Form */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4 sticky top-6">
                        <h3 className="text-base font-bold text-gray-800 flex items-center gap-2 border-b border-gray-100 pb-3">
                            <Plus className="w-5 h-5 text-indigo-500" />
                            Add Time Slot
                        </h3>

                        <form onSubmit={handleAddSlot} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Week</label>
                                <select
                                    value={selectedDay}
                                    onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-white"
                                >
                                    {DAYS_OF_WEEK.map((d) => (
                                        <option key={d.value} value={d.value}>
                                            {d.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={newStart}
                                        onChange={(e) => setNewStart(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={newEnd}
                                        onChange={(e) => setNewEnd(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none bg-gray-50"
                                    />
                                </div>
                            </div>

                            <Button type="submit" variant="secondary" className="w-full">
                                Add Slot to Day
                            </Button>
                        </form>
                    </div>
                </div>

            </div>

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
