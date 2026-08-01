<?php

namespace Database\Seeders;

use App\Models\Medicine;
use App\Models\MedicineBatch;
use Illuminate\Database\Seeder;

class MedicineBatchSeeder extends Seeder
{
    /**
     * Seed 2 stock batches per medicine with varied quantities and expiry dates.
     */
    public function run(): void
    {
        $medicines = Medicine::all();

        if ($medicines->isEmpty()) {
            $this->command->warn('MedicineBatchSeeder: no medicines found.');
            return;
        }

        $count = 0;

        foreach ($medicines as $i => $medicine) {
            // Batch 1 — expires in ~12 months
            MedicineBatch::firstOrCreate(
                ['medicine_id' => $medicine->id, 'batch_no' => 'BATCH-' . str_pad($i * 2 + 1, 4, '0', STR_PAD_LEFT)],
                [
                    'quantity'    => rand(200, 500),
                    'expiry_date' => now()->addMonths(12)->format('Y-m-d'),
                ]
            );

            // Batch 2 — expires in ~6 months (closer expiry)
            MedicineBatch::firstOrCreate(
                ['medicine_id' => $medicine->id, 'batch_no' => 'BATCH-' . str_pad($i * 2 + 2, 4, '0', STR_PAD_LEFT)],
                [
                    'quantity'    => rand(50, 150),
                    'expiry_date' => now()->addMonths(6)->format('Y-m-d'),
                ]
            );

            $count += 2;
        }

        $this->command->info($count . ' medicine batches seeded.');
    }
}
