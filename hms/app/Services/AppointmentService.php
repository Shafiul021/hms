<?php

namespace App\Services;

use App\Events\AppointmentStatusChanged;
use App\Jobs\SendAppointmentEmail;
use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\TimeSlot;
use App\Models\User;
use Hms\Core\Enums\AppointmentStatus;
use Hms\Core\Enums\AppointmentType;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class AppointmentService
{
    /**
     * Book a new scheduled appointment.
     */
    public function book(array $data, User $bookedBy): Appointment
    {
        $slotId = $data['slot_id'];
        $date = $data['date'];
        $doctorId = $data['doctor_id'];

        $slot = TimeSlot::with('schedule')->findOrFail($slotId);

        if ($slot->schedule->doctor_id != $doctorId) {
            throw ValidationException::withMessages(['slot_id' => ['The selected time slot does not belong to this doctor.']]);
        }
        if ($slot->is_blocked || !$slot->schedule->is_active) {
            throw ValidationException::withMessages(['slot_id' => ['The selected time slot is currently blocked or inactive.']]);
        }

        $conflict = Appointment::where('doctor_id', $doctorId)
            ->whereDate('date', $date)
            ->where('slot_id', $slotId)
            ->whereIn('status', [AppointmentStatus::Pending->value, AppointmentStatus::Confirmed->value, AppointmentStatus::Delayed->value, AppointmentStatus::Rescheduled->value])
            ->exists();

        if ($conflict) {
            throw ValidationException::withMessages(['slot_id' => ['The selected time slot is already booked for this date.']]);
        }

        return DB::transaction(function () use ($data, $bookedBy) {
            $appointment = Appointment::create([
                'type'       => AppointmentType::Scheduled,
                'patient_id' => $data['patient_id'],
                'doctor_id'  => $data['doctor_id'],
                'slot_id'    => $data['slot_id'],
                'date'       => $data['date'],
                'status'     => AppointmentStatus::Pending,
                'booked_by'  => $bookedBy->id,
                'notes'      => $data['notes'] ?? null,
            ]);

            AppointmentLog::create([
                'appointment_id' => $appointment->id,
                'old_status'     => null,
                'new_status'     => AppointmentStatus::Pending,
                'changed_by'     => $bookedBy->id,
                'created_type'   => 'scheduled',
            ]);

            SendAppointmentEmail::dispatch($appointment);

            return $appointment;
        });
    }

    /**
     * Book an instant appointment (Emergency, VIP, Walk-in).
     */
    public function bookInstant(array $data, User $bookedBy, AppointmentType $type): Appointment
    {
        if (!$bookedBy->hasRole(['admin', 'receptionist', 'doctor'])) {
            throw new AccessDeniedHttpException("You do not have permission to create instant appointments.");
        }

        return DB::transaction(function () use ($data, $bookedBy, $type) {
            $appointment = Appointment::create([
                'type'       => $type,
                'patient_id' => $data['patient_id'],
                'doctor_id'  => $data['doctor_id'],
                'slot_id'    => $data['slot_id'] ?? null,
                'date'       => $data['date'] ?? now()->toDateString(),
                'status'     => AppointmentStatus::Confirmed,
                'booked_by'  => $bookedBy->id,
                'notes'      => $data['notes'] ?? null,
            ]);

            AppointmentLog::create([
                'appointment_id' => $appointment->id,
                'old_status'     => null,
                'new_status'     => AppointmentStatus::Confirmed,
                'changed_by'     => $bookedBy->id,
                'created_type'   => $type->value,
            ]);

            event(new AppointmentStatusChanged($appointment));

            return $appointment;
        });
    }

    /**
     * Reschedule an appointment.
     */
    public function reschedule(Appointment $appointment, array $data, User $user): Appointment
    {
        if (!$user->hasRole(['admin', 'receptionist', 'doctor'])) {
            throw new AccessDeniedHttpException("You do not have permission to reschedule appointments.");
        }

        return DB::transaction(function () use ($appointment, $data, $user) {
            $oldDate = $appointment->date;
            $oldSlotId = $appointment->slot_id;

            $appointment->status = AppointmentStatus::Rescheduled;
            $appointment->save();

            AppointmentLog::create([
                'appointment_id' => $appointment->id,
                'old_status'     => $appointment->status, // wait this is wrong
                'new_status'     => AppointmentStatus::Rescheduled,
                'changed_by'     => $user->id,
            ]);

            $newAppointment = Appointment::create([
                'type'                => $appointment->type,
                'patient_id'          => $appointment->patient_id,
                'doctor_id'           => $appointment->doctor_id,
                'slot_id'             => $data['slot_id'],
                'date'                => $data['date'],
                'status'              => AppointmentStatus::Confirmed,
                'booked_by'           => $user->id,
                'notes'               => $data['notes'] ?? $appointment->notes,
                'rescheduled_from_id' => $appointment->id,
            ]);

            AppointmentLog::create([
                'appointment_id' => $newAppointment->id,
                'old_status'     => null,
                'new_status'     => AppointmentStatus::Confirmed,
                'changed_by'     => $user->id,
                'metadata'       => [
                    'rescheduled_from_id' => $appointment->id,
                    'old_date' => $oldDate,
                    'old_slot_id' => $oldSlotId,
                ]
            ]);

            event(new AppointmentStatusChanged($appointment));
            event(new AppointmentStatusChanged($newAppointment));
            SendAppointmentEmail::dispatch($newAppointment);

            return $newAppointment;
        });
    }

    /**
     * Cancel an appointment.
     */
    public function cancel(Appointment $appointment, User $user, ?string $reason = null): Appointment
    {
        $hasRole = false;
        if ($user->hasRole(['admin', 'receptionist', 'doctor'])) {
            $hasRole = true;
        } elseif ($user->hasRole('patient') && $appointment->patient->user_id === $user->id) {
            $hasRole = true;
        }

        if (!$hasRole) {
            throw new AccessDeniedHttpException("You do not have permission to cancel this appointment.");
        }

        return DB::transaction(function () use ($appointment, $user, $reason) {
            $oldStatus = $appointment->status;
            
            $appointment->status = AppointmentStatus::Cancelled;
            $appointment->cancelled_by = $user->id;
            $appointment->cancellation_reason = $reason;
            $appointment->save();

            AppointmentLog::create([
                'appointment_id' => $appointment->id,
                'old_status'     => $oldStatus,
                'new_status'     => AppointmentStatus::Cancelled,
                'changed_by'     => $user->id,
                'metadata'       => ['cancellation_reason' => $reason]
            ]);

            event(new AppointmentStatusChanged($appointment));

            return $appointment;
        });
    }

    /**
     * Update appointment status.
     */
    public function updateStatus(Appointment $appointment, AppointmentStatus $newStatus, User $user): Appointment
    {
        $oldStatus = $appointment->status;

        if ($oldStatus === $newStatus) {
            return $appointment;
        }

        if ($newStatus === AppointmentStatus::Cancelled) {
            return $this->cancel($appointment, $user);
        }

        $isValid = false;
        switch ($oldStatus) {
            case AppointmentStatus::Pending:
                $isValid = in_array($newStatus, [AppointmentStatus::Confirmed, AppointmentStatus::Delayed]);
                break;
            case AppointmentStatus::Confirmed:
            case AppointmentStatus::Delayed:
                $isValid = in_array($newStatus, [AppointmentStatus::InProgress, AppointmentStatus::Completed, AppointmentStatus::Missed, AppointmentStatus::Delayed]);
                break;
            case AppointmentStatus::InProgress:
                $isValid = ($newStatus === AppointmentStatus::Completed);
                break;
        }

        if (!$isValid) {
            throw ValidationException::withMessages([
                'status' => ["Transition from {$oldStatus->value} to {$newStatus->value} is not allowed."]
            ]);
        }

        $hasRole = false;
        if ($user->hasRole('admin')) {
            $hasRole = true;
        } else {
            switch ($newStatus) {
                case AppointmentStatus::Confirmed:
                    $hasRole = $user->hasRole('receptionist');
                    break;
                case AppointmentStatus::InProgress:
                case AppointmentStatus::Completed:
                case AppointmentStatus::Delayed:
                case AppointmentStatus::Missed:
                    $hasRole = $user->hasRole(['doctor', 'receptionist']);
                    break;
            }
        }

        if (!$hasRole) {
            throw new AccessDeniedHttpException("You do not have permission to transition this appointment to {$newStatus->value}.");
        }

        return DB::transaction(function () use ($appointment, $oldStatus, $newStatus, $user) {
            $appointment->status = $newStatus;
            $appointment->save();

            AppointmentLog::create([
                'appointment_id' => $appointment->id,
                'old_status'     => $oldStatus,
                'new_status'     => $newStatus,
                'changed_by'     => $user->id,
            ]);

            if ($newStatus === AppointmentStatus::Completed && !$appointment->bill) {
                app(\App\Services\BillingService::class)->generate(['appointment_id' => $appointment->id]);
            }

            event(new AppointmentStatusChanged($appointment));

            return $appointment;
        });
    }
}
