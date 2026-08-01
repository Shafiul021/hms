<?php

namespace Database\Seeders;

use App\Models\DoctorSchedule;
use App\Models\TimeSlot;
use Illuminate\Database\Seeder;

class TimeSlotSeeder extends Seeder
{
    /**
     * Seed hourly time slots (09:00 – 16:00) for every doctor schedule.
     */
    public function run(): void
    {
        // 7 slots per schedule: 09-10, 10-11, 11-12, 13-14, 14-15, 15-16, 16-17
        $slots = [
            ['start' => '09:00:00', 'end' => '10:00:00'],
            ['start' => '10:00:00', 'end' => '11:00:00'],
            ['start' => '11:00:00', 'end' => '12:00:00'],
            ['start' => '13:00:00', 'end' => '14:00:00'],
            ['start' => '14:00:00', 'end' => '15:00:00'],
            ['start' => '15:00:00', 'end' => '16:00:00'],
            ['start' => '16:00:00', 'end' => '17:00:00'],
        ];

        $schedules = DoctorSchedule::all();
        $count     = 0;

        foreach ($schedules as $schedule) {
            foreach ($slots as $slot) {
                TimeSlot::firstOrCreate(
                    [
                        'doctor_schedule_id' => $schedule->id,
                        'start_time'         => $slot['start'],
                    ],
                    [
                        'end_time'   => $slot['end'],
                        'is_blocked' => false,
                    ]
                );
                $count++;
            }
        }

        $this->command->info($count . ' time slots seeded.');
    }
}
