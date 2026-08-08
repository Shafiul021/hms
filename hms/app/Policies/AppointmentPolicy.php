<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'doctor', 'receptionist', 'nurse', 'patient']);
    }

    public function view(User $user, Appointment $appointment): bool
    {
        if ($user->hasAnyRole(['admin', 'receptionist', 'nurse'])) {
            return true;
        }

        if ($user->hasRole('doctor')) {
            return $appointment->doctor && $appointment->doctor->user_id === $user->id;
        }

        if ($user->hasRole('patient')) {
            return $appointment->patient && $appointment->patient->user_id === $user->id;
        }

        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'receptionist', 'patient', 'doctor']);
    }

    public function update(User $user, Appointment $appointment): bool
    {
        if ($user->hasAnyRole(['admin', 'receptionist'])) {
            return true;
        }

        if ($user->hasRole('doctor')) {
            return $appointment->doctor && $appointment->doctor->user_id === $user->id;
        }

        return false;
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        if ($user->hasAnyRole(['admin', 'receptionist'])) {
            return true;
        }

        // Patients can delete (cancel) their own appointments
        return $appointment->patient && $appointment->patient->user_id === $user->id;
    }
}
