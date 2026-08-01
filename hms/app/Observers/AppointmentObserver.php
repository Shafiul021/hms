<?php

namespace App\Observers;

use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class AppointmentObserver
{
    /**
     * Handle the Appointment "created" event.
     */
    public function created(Appointment $appointment): void
    {
        AppointmentLog::create([
            'appointment_id' => $appointment->id,
            'old_status'     => null,
            'new_status'     => $appointment->status->value ?? $appointment->status,
            'changed_by'     => auth()->id() ?? $appointment->booked_by,
        ]);

        ActivityLog::record(
            description: "Appointment booked for patient #{$appointment->patient_id} with doctor #{$appointment->doctor_id} on {$appointment->date}",
            logName: 'appointments',
            subject: $appointment,
            causer: Auth::user(),
            event: 'created',
        );
    }

    /**
     * Handle the Appointment "updated" event.
     */
    public function updated(Appointment $appointment): void
    {
        if ($appointment->isDirty('status')) {
            AppointmentLog::create([
                'appointment_id' => $appointment->id,
                'old_status'     => $appointment->getOriginal('status')->value ?? $appointment->getOriginal('status'),
                'new_status'     => $appointment->status->value ?? $appointment->status,
                'changed_by'     => auth()->id() ?? $appointment->booked_by ?? $appointment->patient->user_id,
            ]);

            $statusVal = $appointment->status->value ?? $appointment->status;
            ActivityLog::record(
                description: "Appointment #{$appointment->id} status changed to {$statusVal}",
                logName: 'appointments',
                subject: $appointment,
                causer: Auth::user(),
                event: 'status_changed',
                properties: ['status' => $statusVal],
            );
        }
    }

    /**
     * Handle the Appointment "deleted" event.
     */
    public function deleted(Appointment $appointment): void
    {
        ActivityLog::record(
            description: "Appointment #{$appointment->id} was cancelled/deleted",
            logName: 'appointments',
            subject: $appointment,
            causer: Auth::user(),
            event: 'deleted',
        );
    }
}
