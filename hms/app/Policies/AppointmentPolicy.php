<?php

namespace App\Policies;

use App\Models\Appointment;
use App\Models\User;

class AppointmentPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'doctor', 'receptionist']);
    }

    public function view(User $user, Appointment $appointment): bool
    {
        if ($user->hasAnyRole(['admin', 'doctor', 'receptionist'])) {
            return true;
        }

        // Patients can view their own appointments
        return $appointment->patient && $appointment->patient->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'receptionist', 'patient']);
    }

    public function update(User $user, Appointment $appointment): bool
    {
        return $user->hasAnyRole(['admin', 'doctor', 'receptionist']);
    }

    public function delete(User $user, Appointment $appointment): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        // Patients can delete (cancel) their own appointments
        return $appointment->patient && $appointment->patient->user_id === $user->id;
    }
}
