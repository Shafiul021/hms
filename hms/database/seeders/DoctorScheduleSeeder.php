<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\DoctorSchedule;
use Illuminate\Database\Seeder;

class DoctorScheduleSeeder extends Seeder
{
    /**
     * Seed weekly schedules for each doctor.
     * Each doctor gets 5 working days (Mon–Fri), days 1–5.
     */
    public function run(): void
    {
        $workingDays = [1, 2, 3, 4, 5]; // Monday=1 … Friday=5

        $doctors = Doctor::all();

        foreach ($doctors as $doctor) {
            foreach ($workingDays as $day) {
                DoctorSchedule::firstOrCreate([
                    'doctor_id'  => $doctor->id,
                    'day_of_week' => $day,
                ], [
                    'is_active' => true,
                ]);
            }
        }

        $total = $doctors->count() * count($workingDays);
        $this->command->info($total . ' doctor schedule entries seeded.');
    }
}
