import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useReschedule } from '../../hooks/useAppointments';
import { doctorsApi } from '../../api/doctors';
import toast from 'react-hot-toast';

export const RescheduleModal = ({ isOpen, onClose, appointment }) => {
    const { mutate: reschedule, isLoading } = useReschedule();
    const [date, setDate] = useState('');
    const [slotId, setSlotId] = useState('');
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    
    // Today's date for min value
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (isOpen && appointment) {
            setDate('');
            setSlotId('');
            setSlots([]);
        }
    }, [isOpen, appointment]);

    useEffect(() => {
        if (!date || !appointment?.doctor_id) {
            setSlots([]);
            return;
        }
        
        setLoadingSlots(true);
        doctorsApi.getDoctorSlots(appointment.doctor_id, date)
            .then(res => {
                const availableSlots = (res.data || res).filter(s => !s.is_blocked);
                setSlots(availableSlots);
            })
            .catch(() => setSlots([]))
            .finally(() => setLoadingSlots(false));
    }, [date, appointment?.doctor_id]);

    const handleReschedule = () => {
        if (!date || !slotId) {
            toast.error("Please select a new date and time slot.");
            return;
        }

        reschedule(
            { 
                id: appointment.id, 
                data: { date, slot_id: slotId }
            },
            {
                onSuccess: () => {
                    toast.success("Appointment rescheduled successfully!");
                    onClose();
                },
                onError: (err) => {
                    toast.error(err?.response?.data?.message || "Failed to reschedule appointment.");
                }
            }
        );
    };

    const formatTime = (t) => (t ? t.substring(0, 5) : '');

    if (!appointment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Reschedule Appointment">
            <div className="space-y-5 pb-4">
                <div className="bg-purple-50 text-purple-800 p-4 rounded-xl text-sm border border-purple-100 space-y-2">
                    <p>
                        You are rescheduling the appointment for <strong>{appointment?.patient?.name}</strong> with <strong>Dr. {appointment?.doctor?.name}</strong>.
                    </p>
                    <p className="text-xs text-purple-600">
                        Current schedule: {appointment?.date} ({appointment?.slot?.start_time?.substring(0, 5)})
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Date <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            min={today}
                            value={date}
                            onChange={(e) => {
                                setDate(e.target.value);
                                setSlotId('');
                            }}
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-400 bg-gray-50"
                        />
                    </div>

                    {date && (
                        <div>
                            <p className="text-sm font-medium text-gray-700 mb-2">Available Time Slots <span className="text-red-500">*</span></p>
                            {loadingSlots ? (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div key={i} className="h-9 rounded-lg bg-gray-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : slots.length === 0 ? (
                                <p className="text-sm text-gray-500 py-2">
                                    No available slots for this date.
                                </p>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                                    {slots.map((s) => {
                                        const label = `${formatTime(s.start_time)}`;
                                        const isSelected = slotId === s.id;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setSlotId(s.id)}
                                                className={`py-2 px-1 rounded-lg text-xs font-medium border transition-all duration-150 ${
                                                    isSelected
                                                        ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                                                        : 'bg-white text-gray-700 border-gray-200 hover:border-purple-400 hover:text-purple-600'
                                                }`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                <Button variant="outline" onClick={onClose} disabled={isLoading}>Cancel</Button>
                <Button 
                    variant="primary" 
                    onClick={handleReschedule} 
                    loading={isLoading} 
                    disabled={!date || !slotId}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                    Confirm Reschedule
                </Button>
            </div>
        </Modal>
    );
};
