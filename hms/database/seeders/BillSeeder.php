<?php

namespace Database\Seeders;

use App\Models\Appointment;
use App\Models\Bill;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class BillSeeder extends Seeder
{
    /**
     * Seed one bill per completed appointment.
     */
    public function run(): void
    {
        $completedAppointments = Appointment::where('status', 'completed')->get();

        if ($completedAppointments->isEmpty()) {
            $this->command->warn('BillSeeder: no completed appointments found.');
            return;
        }

        $statuses = ['issued', 'paid', 'paid', 'partial', 'draft'];
        $count    = 0;

        foreach ($completedAppointments as $i => $appointment) {
            $totalAmount = round(rand(500, 5000) + rand(0, 99) / 100, 2);
            $status      = $statuses[$i % count($statuses)];

            $paidAmount = match ($status) {
                'paid'    => $totalAmount,
                'partial' => round($totalAmount * 0.5, 2),
                default   => 0.00,
            };

            Bill::firstOrCreate(
                ['appointment_id' => $appointment->id],
                [
                    'patient_id'   => $appointment->patient_id,
                    'status'       => $status,
                    'total_amount' => $totalAmount,
                    'paid_amount'  => $paidAmount,
                    'due_date'     => now()->addDays(30)->format('Y-m-d'),
                    'issued_at'    => ($status !== 'draft') ? now()->subDays(rand(1, 5)) : null,
                ]
            );
            $count++;
        }

        $this->command->info($count . ' bills seeded.');
    }
}
