<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\TimeSlot;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    /**
     * Seed appointments with strict referential integrity.
     * Maps real patients to real doctors, finding valid slots.
     */
    public function run(): void
    {
        $patients = Patient::all();
        $doctors  = Doctor::all();

        if ($patients->isEmpty() || $doctors->isEmpty()) {
            $this->command->warn('AppointmentSeeder: missing required dependencies (patients/doctors).');
            return;
        }

        $appointments = [
            ['patient_idx' => 0, 'doctor_idx' => 0, 'date' => '2026-07-05', 'status' => 'completed', 'notes' => 'Routine cardiac check-up'],
            ['patient_idx' => 1, 'doctor_idx' => 1, 'date' => '2026-07-06', 'status' => 'completed', 'notes' => 'Follow-up after MRI'],
            ['patient_idx' => 2, 'doctor_idx' => 2, 'date' => '2026-07-07', 'status' => 'completed', 'notes' => 'Knee pain consultation'],
            ['patient_idx' => 3, 'doctor_idx' => 3, 'date' => '2026-07-08', 'status' => 'completed', 'notes' => 'Antenatal visit'],
            ['patient_idx' => 4, 'doctor_idx' => 4, 'date' => '2026-07-09', 'status' => 'completed', 'notes' => 'Skin rash evaluation'],
            ['patient_idx' => 5, 'doctor_idx' => 5, 'date' => '2026-07-10', 'status' => 'confirmed', 'notes' => 'Child vaccination review'],
            ['patient_idx' => 6, 'doctor_idx' => 6, 'date' => '2026-07-11', 'status' => 'confirmed', 'notes' => 'Fever and cough'],
            ['patient_idx' => 7, 'doctor_idx' => 7, 'date' => '2026-07-12', 'status' => 'confirmed', 'notes' => 'Eye irritation check'],
            ['patient_idx' => 8, 'doctor_idx' => 8, 'date' => '2026-07-13', 'status' => 'pending',   'notes' => 'Anxiety management'],
            ['patient_idx' => 9, 'doctor_idx' => 9, 'date' => '2026-07-14', 'status' => 'pending',   'notes' => 'Ear blockage'],
            ['patient_idx' => 10,'doctor_idx' => 0, 'date' => '2026-07-15', 'status' => 'pending',   'notes' => 'Blood pressure review'],
            ['patient_idx' => 11,'doctor_idx' => 1, 'date' => '2026-07-16', 'status' => 'cancelled', 'notes' => 'Headache persisting'],
            ['patient_idx' => 12,'doctor_idx' => 2, 'date' => '2026-07-17', 'status' => 'cancelled', 'notes' => 'Back pain follow-up'],
            ['patient_idx' => 13,'doctor_idx' => 3, 'date' => '2026-07-18', 'status' => 'in_progress','notes' => 'Post-natal checkup'],
            ['patient_idx' => 14,'doctor_idx' => 4, 'date' => '2026-07-19', 'status' => 'in_progress','notes' => 'Acne treatment'],
            ['patient_idx' => 0, 'doctor_idx' => 5, 'date' => '2026-07-20', 'status' => 'completed', 'notes' => 'General wellness'],
            ['patient_idx' => 1, 'doctor_idx' => 6, 'date' => '2026-07-21', 'status' => 'completed', 'notes' => 'Diabetes management'],
            ['patient_idx' => 2, 'doctor_idx' => 7, 'date' => '2026-07-22', 'status' => 'confirmed', 'notes' => 'Cataract consultation'],
            ['patient_idx' => 3, 'doctor_idx' => 8, 'date' => '2026-07-23', 'status' => 'pending',   'notes' => 'Depression screening'],
            ['patient_idx' => 4, 'doctor_idx' => 9, 'date' => '2026-07-24', 'status' => 'pending',   'notes' => 'Tonsillitis review'],
        ];

        $created = 0;
        foreach ($appointments as $data) {
            // Get patient and doctor (fallback to first if index is out of bounds)
            $patient = $patients->get($data['patient_idx']) ?? $patients->first();
            $doctor  = $doctors->get($data['doctor_idx']) ?? $doctors->first();

            // Find a valid time slot specifically for this doctor
            // This prevents the bug where slots belong to a different doctor
            $slot = TimeSlot::whereHas('schedule', function ($query) use ($doctor) {
                $query->where('doctor_id', $doctor->id);
            })->first();

            if (!$slot) {
                $this->command->warn("Skipping appointment for Doctor ID {$doctor->id} - No time slots available.");
                continue;
            }

            Appointment::firstOrCreate(
                [
                    'patient_id' => $patient->id,
                    'doctor_id'  => $doctor->id,
                    'date'       => $data['date'],
                ],
                [
                    'slot_id'    => $slot->id,
                    'status'     => $data['status'],
                    'booked_by'  => $patient->user_id, // Setting booked_by to the patient's User ID
                    'notes'      => $data['notes'],
                ]
            );
            $created++;
        }

        $this->command->info($created . ' appointments seeded securely.');
    }
}
