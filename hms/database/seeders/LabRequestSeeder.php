<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\LabRequest;
use App\Models\LabTest;
use Illuminate\Database\Seeder;

class LabRequestSeeder extends Seeder
{
    /**
     * Seed lab requests for completed appointments.
     * Each appointment gets 1-2 lab test requests.
     */
    public function run(): void
    {
        $appointments = Appointment::where('status', 'completed')->take(10)->get();
        $labTests     = LabTest::pluck('id')->toArray();

        if ($appointments->isEmpty() || empty($labTests)) {
            $this->command->warn('LabRequestSeeder: missing completed appointments or lab tests.');
            return;
        }

        $statuses = ['completed', 'completed', 'completed', 'processing', 'requested'];
        $count    = 0;

        foreach ($appointments as $i => $appointment) {
            LabRequest::firstOrCreate(
                [
                    'appointment_id' => $appointment->id,
                    'test_id'        => $labTests[$i % count($labTests)],
                ],
                [
                    'doctor_id'  => $appointment->doctor_id,
                    'patient_id' => $appointment->patient_id,
                    'status'     => $statuses[$i % count($statuses)],
                ]
            );
            $count++;
        }

        $this->command->info($count . ' lab requests seeded.');
    }
}
