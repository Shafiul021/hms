<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\AppointmentLog;
use App\Models\User;
use Illuminate\Database\Seeder;

class AppointmentLogSeeder extends Seeder
{
    /**
     * Seed status-change logs for all seeded appointments.
     * Simulates a lifecycle: pending → confirmed → completed (or cancelled).
     */
    public function run(): void
    {
        $adminId = User::where('email', 'admin@hms.com')->value('id');
        $appointments = Appointment::all();

        if ($appointments->isEmpty() || !$adminId) {
            $this->command->warn('AppointmentLogSeeder: no appointments or admin found.');
            return;
        }

        $lifecycles = [
            'completed'   => [null, 'pending', 'confirmed', 'completed'],
            'cancelled'   => [null, 'pending', 'cancelled'],
            'confirmed'   => [null, 'pending', 'confirmed'],
            'in_progress' => [null, 'pending', 'confirmed', 'in_progress'],
            'pending'     => [null, 'pending'],
        ];

        $count = 0;

        foreach ($appointments as $appointment) {
            $statusVal = $appointment->status instanceof \BackedEnum ? $appointment->status->value : $appointment->status;
            $steps = $lifecycles[$statusVal] ?? [null, 'pending'];

            for ($i = 1; $i < count($steps); $i++) {
                AppointmentLog::create([
                    'appointment_id' => $appointment->id,
                    'old_status'     => $steps[$i - 1],
                    'new_status'     => $steps[$i],
                    'changed_by'     => $adminId,
                ]);
                $count++;
            }
        }

        $this->command->info($count . ' appointment log entries seeded.');
    }
}
