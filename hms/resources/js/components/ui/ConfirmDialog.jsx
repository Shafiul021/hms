import React, { useId } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react';

export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirm Action',
    message = 'Are you sure you want to perform this action? This cannot be undone.',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = false,
    isLoading = false,
}) => {
    // Unique ID for aria-describedby linkage
    const descId = useId();

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            size="sm"
            // Promote to alertdialog via aria override inside Modal's role
        >
            {/* aria-describedby points at the message paragraph */}
            <div
                role="alertdialog"
                aria-describedby={descId}
                className="space-y-6"
            >
                <div className="flex gap-4 items-start">
                    <div
                        aria-hidden="true"
                        className={`p-3 rounded-xl shrink-0 ${
                            isDanger
                                ? 'bg-red-50 text-red-600 border border-red-100'
                                : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}
                    >
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <p id={descId} className="text-sm text-slate-600 leading-relaxed mt-1">
                        {message}
                    </p>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                        aria-label={cancelText}
                    >
                        {cancelText}
                    </Button>
                    <Button 
                        variant={isDanger ? 'danger' : 'primary'} 
                        onClick={onConfirm} 
                        isLoading={isLoading}
                        aria-label={confirmText}
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};
