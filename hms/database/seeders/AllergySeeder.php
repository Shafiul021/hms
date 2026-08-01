<?php

namespace Database\Seeders;

use App\Models\Allergy;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class AllergySeeder extends Seeder
{
    /**
     * Seed sample allergies for the first 8 patients.
     */
    public function run(): void
    {
        $allergyData = [
            // [allergen, severity, notes]
            ['Penicillin',    'severe',   'Anaphylactic reaction reported'],
            ['Dust',          'mild',     'Seasonal sneezing'],
            ['Peanuts',       'moderate', 'Hives and swelling'],
            ['Aspirin',       'moderate', 'GI upset and rash'],
            ['Shellfish',     'severe',   'Anaphylaxis risk'],
            ['Latex',         'mild',     'Contact dermatitis'],
            ['Sulfa drugs',   'moderate', 'Rash and fever'],
            ['Egg',           'mild',     'Mild skin reaction'],
        ];

        $patients = Patient::take(8)->get();

        foreach ($patients as $index => $patient) {
            if (!isset($allergyData[$index])) {
                break;
            }
            [$allergen, $severity, $notes] = $allergyData[$index];

            Allergy::firstOrCreate(
                ['patient_id' => $patient->id, 'allergen' => $allergen],
                ['severity' => $severity, 'notes' => $notes]
            );
        }

        $this->command->info('Allergies seeded for ' . min($patients->count(), count($allergyData)) . ' patients.');
    }
}
