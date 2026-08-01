<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Diagnosis;
use Illuminate\Database\Seeder;

class DiagnosisSeeder extends Seeder
{
    /**
     * Seed diagnoses for all 'completed' appointments.
     */
    public function run(): void
    {
        $completedAppointments = Appointment::where('status', 'completed')->get();

        if ($completedAppointments->isEmpty()) {
            $this->command->warn('DiagnosisSeeder: no completed appointments found.');
            return;
        }

        $diagnosisPool = [
            ['icd_code' => 'I10',   'description' => 'Essential (primary) hypertension',            'notes' => 'BP 150/95 mmHg. Lifestyle modification advised.'],
            ['icd_code' => 'G43.9', 'description' => 'Migraine, unspecified',                       'notes' => 'Recurring episodes. Sumatriptan prescribed.'],
            ['icd_code' => 'M17.1', 'description' => 'Primary osteoarthritis of knee',              'notes' => 'X-ray confirms moderate joint space narrowing.'],
            ['icd_code' => 'O26.9', 'description' => 'Pregnancy-related condition, unspecified',    'notes' => 'Routine antenatal care, no complications.'],
            ['icd_code' => 'L30.9', 'description' => 'Dermatitis, unspecified',                     'notes' => 'Contact dermatitis, topical steroid advised.'],
            ['icd_code' => 'J06.9', 'description' => 'Acute upper respiratory infection, unspecified','notes' => 'Viral URTI, symptomatic treatment recommended.'],
            ['icd_code' => 'E11.9', 'description' => 'Type 2 diabetes mellitus without complications','notes' => 'HbA1c 7.8%. Metformin dose adjusted.'],
        ];

        $count = 0;

        foreach ($completedAppointments as $i => $appointment) {
            $pool = $diagnosisPool[$i % count($diagnosisPool)];

            Diagnosis::firstOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'doctor_id'   => $appointment->doctor_id,
                    'patient_id'  => $appointment->patient_id,
                    'icd_code'    => $pool['icd_code'],
                    'description' => $pool['description'],
                    'notes'       => $pool['notes'],
                ]
            );
            $count++;
        }

        $this->command->info($count . ' diagnoses seeded.');
    }
}
