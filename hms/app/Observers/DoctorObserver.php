<?php

namespace App\Observers;

use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\TimeSlot;
use App\Models\ActivityLog;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class DoctorObserver
{
    /**
     * Handle the Doctor "created" event.
     * Auto-seeds Mon–Fri schedule with 30-minute slots (09:00–17:00).
     */
    public function created(Doctor $doctor): void
    {
        // Mon-Fri schedule
        for ($day = 1; $day <= 5; $day++) {
            $schedule = DoctorSchedule::create([
                'doctor_id'   => $doctor->id,
                'day_of_week' => $day,
                'is_active'   => true,
            ]);

            $startTime = Carbon::createFromTime(9, 0, 0);
            $endTime   = Carbon::createFromTime(17, 0, 0);

            while ($startTime->lessThan($endTime)) {
                $slotStart = $startTime->toTimeString();
                $startTime->addMinutes(30);
                $slotEnd = $startTime->toTimeString();

                TimeSlot::create([
                    'doctor_schedule_id' => $schedule->id,
                    'start_time'         => $slotStart,
                    'end_time'           => $slotEnd,
                    'is_blocked'         => false,
                ]);
            }
        }

        ActivityLog::record(
            description: "New doctor registered: {$doctor->user?->name} ({$doctor->specialization})",
            logName: 'doctors',
            subject: $doctor,
            causer: Auth::user(),
            event: 'created',
        );
    }

    /**
     * Handle the Doctor "updated" event.
     */
    public function updated(Doctor $doctor): void
    {
        if ($doctor->wasChanged()) {
            ActivityLog::record(
                description: "Doctor #{$doctor->id} profile updated",
                logName: 'doctors',
                subject: $doctor,
                causer: Auth::user(),
                event: 'updated',
            );
        }
    }

    /**
     * Handle the Doctor "deleted" event.
     */
    public function deleted(Doctor $doctor): void
    {
        ActivityLog::record(
            description: "Doctor #{$doctor->id} was removed from the system",
            logName: 'doctors',
            subject: $doctor,
            causer: Auth::user(),
            event: 'deleted',
        );
    }
}
