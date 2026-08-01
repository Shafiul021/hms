<?php

namespace App\Policies;

use App\Models\Bill;
use App\Models\User;

class BillPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'receptionist']);
    }

    public function view(User $user, Bill $bill): bool
    {
        if ($user->hasAnyRole(['admin', 'receptionist'])) {
            return true;
        }

        // Patients can view their own bills
        return $bill->patient && $bill->patient->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'receptionist']);
    }

    public function update(User $user, Bill $bill): bool
    {
        return $user->hasAnyRole(['admin', 'receptionist']);
    }

    public function delete(User $user, Bill $bill): bool
    {
        return $user->hasRole('admin');
    }
}
