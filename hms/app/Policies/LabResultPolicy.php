<?php

namespace App\Policies;

use App\Models\LabResult;
use App\Models\User;

class LabResultPolicy
{
    public function view(User $user, LabResult $labResult): bool
    {
        if ($user->hasAnyRole(['admin', 'doctor', 'nurse'])) {
            return true;
        }

        // Patients can view their own lab results via lab_request → patient
        $patientUserId = $labResult->labRequest?->patient?->user_id;
        return $patientUserId && $patientUserId === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'nurse']);
    }

    public function update(User $user, LabResult $labResult): bool
    {
        return $user->hasAnyRole(['admin', 'nurse']);
    }

    public function delete(User $user, LabResult $labResult): bool
    {
        return $user->hasRole('admin');
    }
}
