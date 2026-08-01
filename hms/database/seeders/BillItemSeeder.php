<?php

namespace Database\Seeders;

use App\Models\Bill;
use App\Models\BillItem;
use Illuminate\Database\Seeder;

class BillItemSeeder extends Seeder
{
    /**
     * Seed 2-3 bill items per bill covering consultation, lab, medicine, and bed charges.
     */
    public function run(): void
    {
        $bills = Bill::all();

        if ($bills->isEmpty()) {
            $this->command->warn('BillItemSeeder: no bills found.');
            return;
        }

        $itemTemplates = [
            ['item_type' => 'consultation', 'description' => 'Doctor consultation fee',         'quantity' => 1, 'unit_price' => 700.00],
            ['item_type' => 'lab',          'description' => 'Complete Blood Count (CBC)',       'quantity' => 1, 'unit_price' => 350.00],
            ['item_type' => 'lab',          'description' => 'Liver Function Test (LFT)',        'quantity' => 1, 'unit_price' => 500.00],
            ['item_type' => 'medicine',     'description' => 'Prescribed medicines dispense',    'quantity' => 1, 'unit_price' => 450.00],
            ['item_type' => 'bed',          'description' => 'Ward bed charge (per day)',         'quantity' => 3, 'unit_price' => 800.00],
            ['item_type' => 'consultation', 'description' => 'Specialist follow-up fee',         'quantity' => 1, 'unit_price' => 900.00],
            ['item_type' => 'lab',          'description' => 'Blood Glucose (Fasting & PP)',     'quantity' => 1, 'unit_price' => 200.00],
            ['item_type' => 'medicine',     'description' => 'IV fluids and consumables',        'quantity' => 2, 'unit_price' => 300.00],
        ];

        $count = 0;

        foreach ($bills as $i => $bill) {
            // 2 items per bill
            for ($j = 0; $j < 2; $j++) {
                $template = $itemTemplates[($i * 2 + $j) % count($itemTemplates)];
                $total    = round($template['quantity'] * $template['unit_price'], 2);

                BillItem::firstOrCreate(
                    [
                        'bill_id'     => $bill->id,
                        'description' => $template['description'],
                    ],
                    [
                        'item_type'  => $template['item_type'],
                        'quantity'   => $template['quantity'],
                        'unit_price' => $template['unit_price'],
                        'total'      => $total,
                    ]
                );
                $count++;
            }
        }

        $this->command->info($count . ' bill items seeded.');
    }
}
