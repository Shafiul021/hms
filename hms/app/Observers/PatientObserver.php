<?php

namespace App\Observers;

use App\Models\Patient;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class PatientObserver
{
    /**
     * Handle the Patient "creating" event.
     * Auto-generates a unique patient code: HMS-YYYY-XXXXX before insertion.
     */
    public function creating(Patient $patient): void
    {
        $year   = now()->year;
        $nextId = (Patient::max('id') ?? 0) + 1;
        $patient->patient_code = sprintf('HMS-%d-%05d', $year, $nextId);
    }

    /**
     * Handle the Patient "created" event.
     */
    public function created(Patient $patient): void
    {
        ActivityLog::record(
            description: "New patient registered: {$patient->patient_code}",
            logName: 'patients',
            subject: $patient,
            causer: Auth::user(),
            event: 'created',
        );
    }

    /**
     * Handle the Patient "updated" event.
     */
    public function updated(Patient $patient): void
    {
        if ($patient->wasChanged()) {
            ActivityLog::record(
                description: "Patient #{$patient->id} ({$patient->patient_code}) profile updated",
                logName: 'patients',
                subject: $patient,
                causer: Auth::user(),
                event: 'updated',
            );
        }
    }

    /**
     * Handle the Patient "deleted" event.
     */
    public function deleted(Patient $patient): void
    {
        ActivityLog::record(
            description: "Patient #{$patient->id} ({$patient->patient_code}) was deleted",
            logName: 'patients',
            subject: $patient,
            causer: Auth::user(),
            event: 'deleted',
        );
    }

    /**
     * Handle the Patient "restored" event.
     */
    public function restored(Patient $patient): void
    {
        //
    }

    /**
     * Handle the Patient "force deleted" event.
     */
    public function forceDeleted(Patient $patient): void
    {
        //
    }
}
