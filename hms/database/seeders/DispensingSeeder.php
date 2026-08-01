<?php

namespace Database\Seeders;

use App\Models\Dispensing;
use App\Models\Prescription;
use App\Models\User;
use Illuminate\Database\Seeder;

class DispensingSeeder extends Seeder
{
    /**
     * Seed one dispensing record per prescription.
     * Uses the admin user as the pharmacist for seed data.
     */
    public function run(): void
    {
        $prescriptions  = Prescription::all();
        $pharmacistId   = User::where('email', 'admin@hms.com')->value('id');

        if ($prescriptions->isEmpty() || !$pharmacistId) {
            $this->command->warn('DispensingSeeder: no prescriptions or pharmacist found.');
            return;
        }

        $notes = [
            'All medicines dispensed. Patient counselled on dosage.',
            'Partial dispense — one item out of stock. Rest dispensed.',
            'Full dispense completed. Patient advised on storage.',
            'Medicines dispensed. Allergy interaction noted and resolved.',
            'Dispensed as per prescription. Follow-up in 7 days.',
            'Patient informed of possible side effects.',
            'Complete dispense. Cold-chain item placed in carry bag.',
        ];

        $count = 0;

        foreach ($prescriptions as $i => $prescription) {
            Dispensing::firstOrCreate(
                ['prescription_id' => $prescription->id],
                [
                    'pharmacist_id' => $pharmacistId,
                    'dispensed_at'  => now()->subHours(rand(1, 48)),
                    'notes'         => $notes[$i % count($notes)],
                ]
            );
            $count++;
        }

        $this->command->info($count . ' dispensing records seeded.');
    }
}
