<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\Bed;
use App\Models\Doctor;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class AdmissionSeeder extends Seeder
{
    /**
     * Seed 6 patient admissions using available beds.
     */
    public function run(): void
    {
        $patients = Patient::take(6)->get();
        $doctors  = Doctor::all();
        $beds     = Bed::all();

        if ($patients->isEmpty() || $doctors->isEmpty() || $beds->isEmpty()) {
            $this->command->warn('AdmissionSeeder: missing patients, doctors, or beds.');
            return;
        }

        $reasons = [
            'Acute myocardial infarction requiring monitoring',
            'Post-operative recovery after knee surgery',
            'Severe pneumonia with respiratory distress',
            'Diabetic ketoacidosis management',
            'Severe dehydration and electrolyte imbalance',
            'Pre-operative preparation for elective surgery',
        ];

        $count = 0;

        foreach ($patients as $i => $patient) {
            if (!isset($beds[$i])) {
                break;
            }

            Admission::firstOrCreate(
                ['patient_id' => $patient->id],
                [
                    'bed_id'        => $beds[$i]->id,
                    'doctor_id'     => $doctors[$i % $doctors->count()]->id,
                    'admitted_at'   => now()->subDays(rand(1, 10)),
                    'discharged_at' => ($i < 3) ? now()->subDays(rand(0, 1)) : null,
                    'reason'        => $reasons[$i],
                    'notes'         => 'Admitted via emergency department.',
                ]
            );
            $count++;
        }

        $this->command->info($count . ' admissions seeded.');
    }
}
