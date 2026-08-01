<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\TimeSlot;
use App\Models\User;
use Illuminate\Database\Seeder;

class AppointmentSeeder extends Seeder
{
    /**
     * Seed 20 appointments spread across statuses.
     * Uses the admin user as the booker for all seed records.
     */
    public function run(): void
    {
        $patients  = Patient::pluck('id')->toArray();
        $doctors   = Doctor::pluck('id')->toArray();
        $slots     = TimeSlot::pluck('id')->toArray();
        $adminId   = User::where('email', 'admin@hms.com')->value('id');

        if (empty($patients) || empty($doctors) || empty($slots) || !$adminId) {
            $this->command->warn('AppointmentSeeder: missing required dependencies (patients/doctors/slots/admin).');
            return;
        }

        $statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];

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
        foreach ($appointments as $i => $data) {
            $patientId = $patients[$data['patient_idx']] ?? $patients[0];
            $doctorId  = $doctors[$data['doctor_idx']]  ?? $doctors[0];
            $slotId    = $slots[$i % count($slots)];

            Appointment::firstOrCreate(
                [
                    'patient_id' => $patientId,
                    'doctor_id'  => $doctorId,
                    'date'       => $data['date'],
                ],
                [
                    'slot_id'    => $slotId,
                    'status'     => $data['status'],
                    'booked_by'  => $adminId,
                    'notes'      => $data['notes'],
                ]
            );
            $created++;
        }

        $this->command->info($created . ' appointments seeded.');
    }
}
