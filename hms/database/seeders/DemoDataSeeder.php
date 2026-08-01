<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\Patient;
use App\Models\TimeSlot;
use App\Models\User;
use Hms\Core\Enums\AppointmentStatus;
use Hms\Core\Enums\BillStatus;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding demo data...');

        // ── 10 Doctors ─────────────────────────────────────────────────────────
        $specializations = [
            'Cardiology', 'Neurology', 'Pediatrics', 'Orthopedics',
            'Dermatology', 'Oncology', 'Radiology', 'ENT', 'Ophthalmology', 'General Medicine',
        ];

        $doctors = collect();
        foreach ($specializations as $i => $spec) {
            $user = User::firstOrCreate(
                ['email' => "doctor{$i}@demo.hms"],
                [
                    'name'     => "Dr. Demo {$spec}",
                    'password' => Hash::make('password'),
                ]
            );
            $user->syncRoles(['doctor']);

            $doctor = Doctor::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'specialization' => $spec,
                    'qualification'  => 'MBBS, MD',
                    'fee'            => rand(300, 1500),
                ]
            );
            $doctors->push($doctor);
        }
        $this->command->info("  ✓ {$doctors->count()} doctors");

        // ── Ensure schedules + time slots exist for each doctor ────────────────
        // day_of_week: 0=Sunday, 1=Monday ... 5=Friday
        $days = [1, 2, 3, 4, 5]; // Mon–Fri
        $slotTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30'];

        $allSlots = collect();
        foreach ($doctors as $doctor) {
            foreach ($days as $day) {
                $schedule = DoctorSchedule::firstOrCreate(
                    ['doctor_id' => $doctor->id, 'day_of_week' => $day],
                    ['is_active' => true]
                );

                foreach ($slotTimes as $time) {
                    $slot = TimeSlot::firstOrCreate(
                        [
                            'doctor_schedule_id' => $schedule->id,
                            'start_time'         => $time,
                        ],
                        [
                            'end_time'   => Carbon::parse($time)->addMinutes(30)->format('H:i'),
                            'is_blocked' => false,
                        ]
                    );
                    $allSlots->push(['slot' => $slot, 'doctor' => $doctor]);
                }
            }
        }

        // ── 50 Patients ─────────────────────────────────────────────────────────
        $patients = collect();
        for ($i = 1; $i <= 50; $i++) {
            $user = User::firstOrCreate(
                ['email' => "patient{$i}@demo.hms"],
                [
                    'name'     => "Patient Demo {$i}",
                    'password' => Hash::make('password'),
                ]
            );
            $user->syncRoles(['patient']);

            $patient = Patient::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'dob'          => Carbon::now()->subYears(rand(18, 75))->subDays(rand(0, 365))->toDateString(),
                    'gender'       => collect(['male', 'female'])->random(),
                    'blood_type'   => collect(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'])->random(),
                    'phone'        => '+1-555-' . str_pad(rand(1000, 9999), 4, '0', STR_PAD_LEFT),
                    'address'      => "{$i} Demo Street, Health City",
                    'patient_code' => 'PT-' . strtoupper(Str::random(6)),
                ]
            );
            $patients->push($patient);
        }
        $this->command->info("  ✓ {$patients->count()} patients");

        // ── 200 Appointments ────────────────────────────────────────────────────
        if ($allSlots->isEmpty()) {
            $this->command->warn('  ! No time slots found — skipping appointments.');
            return;
        }

        $apptCount   = 0;
        $billsCreated = 0;

        for ($i = 0; $i < 200; $i++) {
            $patient    = $patients->random();
            $slotDoctor = $allSlots->random();
            $slot       = $slotDoctor['slot'];
            $doctor     = $slotDoctor['doctor'];

            $daysAgo = rand(0, 180);
            $date    = Carbon::today()->subDays($daysAgo)->toDateString();

            // Determine status: old appointments should mostly be completed/cancelled
            if ($daysAgo > 14) {
                $status = collect([AppointmentStatus::Completed, AppointmentStatus::Completed, AppointmentStatus::Cancelled])->random();
            } else {
                $status = collect(AppointmentStatus::cases())->random();
            }

            $appointment = Appointment::create([
                'patient_id' => $patient->id,
                'doctor_id'  => $doctor->id,
                'slot_id'    => $slot->id,
                'date'       => $date,
                'status'     => $status,
                'booked_by'  => $patient->user_id,
                'notes'      => $i % 7 === 0 ? 'Demo appointment — follow-up required.' : null,
            ]);
            $apptCount++;

            // ── Bill for completed appointments ──────────────────────────────────
            if ($status === AppointmentStatus::Completed) {
                $fee        = (int) ($doctor->fee ?? 500);
                $billStatus = collect([BillStatus::Paid, BillStatus::Paid, BillStatus::Issued, BillStatus::Partial])->random();
                $paidAmount = match ($billStatus) {
                    BillStatus::Paid    => $fee,
                    BillStatus::Partial => round($fee * (rand(2, 8) / 10), 2),
                    default             => 0,
                };

                $bill = Bill::create([
                    'appointment_id' => $appointment->id,
                    'patient_id'     => $patient->id,
                    'total_amount'   => $fee,
                    'paid_amount'    => $paidAmount,
                    'status'         => $billStatus,
                    'issued_at'      => Carbon::parse($date)->addHours(rand(1, 4)),
                    'due_date'       => Carbon::parse($date)->addDays(30)->toDateString(),
                ]);

                BillItem::create([
                    'bill_id'     => $bill->id,
                    'item_type'   => 'consultation',
                    'description' => 'Consultation fee — ' . $doctor->specialization,
                    'quantity'    => 1,
                    'unit_price'  => $fee,
                    'total'       => $fee,
                ]);
                $billsCreated++;
            }
        }

        $this->command->info("  ✓ {$apptCount} appointments, {$billsCreated} bills created");
        $this->command->info('Demo data seeded successfully ✓');
    }
}
