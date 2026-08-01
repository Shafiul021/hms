<?php

namespace Database\Seeders;

use App\Models\Medicine;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use Illuminate\Database\Seeder;

class PrescriptionItemSeeder extends Seeder
{
    /**
     * Seed 2-3 prescription items per prescription.
     */
    public function run(): void
    {
        $prescriptions = Prescription::all();
        $medicines     = Medicine::pluck('id')->toArray();

        if ($prescriptions->isEmpty() || empty($medicines)) {
            $this->command->warn('PrescriptionItemSeeder: missing prescriptions or medicines.');
            return;
        }

        $itemTemplates = [
            ['dosage' => '500mg',  'frequency' => 'Twice daily',       'duration' => '5 days'],
            ['dosage' => '400mg',  'frequency' => 'Three times daily',  'duration' => '7 days'],
            ['dosage' => '10mg',   'frequency' => 'Once daily (morning)','duration' => '30 days'],
            ['dosage' => '250mg',  'frequency' => 'Three times daily',  'duration' => '7 days'],
            ['dosage' => '20mg',   'frequency' => 'Once daily at night','duration' => '14 days'],
            ['dosage' => '5mg',    'frequency' => 'Once daily',         'duration' => '30 days'],
            ['dosage' => '50mg',   'frequency' => 'Twice daily',        'duration' => '10 days'],
        ];

        $count = 0;

        foreach ($prescriptions as $i => $prescription) {
            // 2 items per prescription
            for ($j = 0; $j < 2; $j++) {
                $template   = $itemTemplates[($i * 2 + $j) % count($itemTemplates)];
                $medicineId = $medicines[($i * 2 + $j) % count($medicines)];

                PrescriptionItem::firstOrCreate(
                    [
                        'prescription_id' => $prescription->id,
                        'medicine_id'     => $medicineId,
                    ],
                    [
                        'dosage'    => $template['dosage'],
                        'frequency' => $template['frequency'],
                        'duration'  => $template['duration'],
                    ]
                );
                $count++;
            }
        }

        $this->command->info($count . ' prescription items seeded.');
    }
}
