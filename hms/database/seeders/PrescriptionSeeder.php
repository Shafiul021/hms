<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Prescription;
use Illuminate\Database\Seeder;

class PrescriptionSeeder extends Seeder
{
    /**
     * Seed one prescription per completed appointment.
     */
    public function run(): void
    {
        $completedAppointments = Appointment::where('status', 'completed')->get();

        if ($completedAppointments->isEmpty()) {
            $this->command->warn('PrescriptionSeeder: no completed appointments found.');
            return;
        }

        $notePool = [
            'Avoid NSAIDs. Follow a low-sodium diet.',
            'Rest adequately. Drink plenty of fluids.',
            'Continue physiotherapy sessions twice weekly.',
            'Return for follow-up in 2 weeks.',
            'Avoid direct sunlight. Apply sunscreen.',
            'Blood sugar monitoring twice daily.',
            'Avoid strenuous exercise for 2 weeks.',
        ];

        $count = 0;

        foreach ($completedAppointments as $i => $appointment) {
            Prescription::firstOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'doctor_id'  => $appointment->doctor_id,
                    'patient_id' => $appointment->patient_id,
                    'notes'      => $notePool[$i % count($notePool)],
                ]
            );
            $count++;
        }

        $this->command->info($count . ' prescriptions seeded.');
    }
}
