<?php

namespace Database\Seeders;

use App\Models\Bill;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Database\Seeder;

class PaymentSeeder extends Seeder
{
    /**
     * Seed payments for 'paid' and 'partial' bills.
     * Uses admin as the recording user.
     */
    public function run(): void
    {
        $bills      = Bill::whereIn('status', ['paid', 'partial'])->get();
        $adminId    = User::where('email', 'admin@hms.com')->value('id');

        if ($bills->isEmpty() || !$adminId) {
            $this->command->warn('PaymentSeeder: no paid/partial bills or admin found.');
            return;
        }

        $methods = ['cash', 'card', 'online'];
        $count   = 0;

        foreach ($bills as $i => $bill) {
            $method      = $methods[$i % count($methods)];
            $referenceNo = ($method !== 'cash') ? 'REF-' . strtoupper(substr(md5($bill->id . $i), 0, 8)) : null;

            Payment::firstOrCreate(
                ['bill_id' => $bill->id, 'amount' => $bill->paid_amount],
                [
                    'method'       => $method,
                    'reference_no' => $referenceNo,
                    'paid_at'      => now()->subDays(rand(0, 3)),
                    'recorded_by'  => $adminId,
                ]
            );
            $count++;
        }

        $this->command->info($count . ' payments seeded.');
    }
}
