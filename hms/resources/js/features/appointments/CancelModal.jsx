import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useCancelWithReason } from '../../hooks/useAppointments';
import toast from 'react-hot-toast';

export const CancelModal = ({ isOpen, onClose, appointment }) => {
    const [reason, setReason] = useState('');
    const { mutate: cancel, isLoading } = useCancelWithReason();

    // Reset state when modal opens
    React.useEffect(() => {
        if (isOpen) setReason('');
    }, [isOpen]);

    const handleCancel = () => {
        if (!reason.trim()) {
            toast.error("Please provide a cancellation reason.");
            return;
        }
        cancel(
            { id: appointment.id, reason },
            {
                onSuccess: () => {
                    toast.success("Appointment cancelled successfully.");
                    onClose();
                },
                onError: (err) => {
                    toast.error(err?.response?.data?.message || "Failed to cancel appointment.");
                }
            }
        );
    };

    if (!appointment) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Cancel Appointment">
            <div className="space-y-4">
                <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm border border-red-100">
                    Are you sure you want to cancel the appointment for <strong>{appointment?.patient?.name}</strong> with <strong>Dr. {appointment?.doctor?.name}</strong>?
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reason for Cancellation <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                        className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-xl shadow-sm focus:ring-2 focus:ring-red-500/40 focus:border-red-400 sm:text-sm resize-none"
                        rows="3"
                        placeholder="e.g. Patient requested cancellation, Doctor unavailable..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    ></textarea>
                </div>
                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={isLoading}>Keep Appointment</Button>
                    <Button variant="danger" onClick={handleCancel} loading={isLoading}>Confirm Cancellation</Button>
                </div>
            </div>
        </Modal>
    );
};
