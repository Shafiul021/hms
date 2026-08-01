<?php

namespace Database\Seeders;

use App\Models\Admission;
use App\Models\NursingNote;
use App\Models\User;
use Illuminate\Database\Seeder;

class NursingNoteSeeder extends Seeder
{
    /**
     * Seed 2 nursing notes per admission.
     * Uses the admin user as the nurse author (update when nurse users are seeded).
     */
    public function run(): void
    {
        $admissions = Admission::all();
        $nurseUser  = User::where('email', 'admin@hms.com')->value('id');

        if ($admissions->isEmpty() || !$nurseUser) {
            $this->command->warn('NursingNoteSeeder: no admissions or nurse user found.');
            return;
        }

        $notePool = [
            'Patient vitals stable. BP 120/80, pulse 72 bpm, temperature 37°C.',
            'Patient complained of mild pain at wound site. Paracetamol administered as prescribed.',
            'Patient ambulated with assistance. No dizziness reported.',
            'IV fluids running at 80 ml/hr. Site appears clean and patent.',
            'Patient slept well through the night. Morning vitals within normal range.',
            'Oral intake resumed. Tolerating soft diet without nausea.',
            'Wound dressing changed. Site clean, no signs of infection.',
            'Patient anxious about discharge. Education on home care provided.',
            'Blood glucose 6.2 mmol/L post meal. Insulin administered as per chart.',
            'Patient using incentive spirometer every 2 hours as instructed.',
            'Foley catheter output 300 ml last 4 hours. Urine clear yellow.',
            'Patient comfortable and resting. Family visit noted.',
        ];

        $count = 0;

        foreach ($admissions as $i => $admission) {
            for ($j = 0; $j < 2; $j++) {
                NursingNote::create([
                    'admission_id' => $admission->id,
                    'nurse_id'     => $nurseUser,
                    'note'         => $notePool[($i * 2 + $j) % count($notePool)],
                    'recorded_at'  => now()->subHours(rand(1, 72)),
                ]);
                $count++;
            }
        }

        $this->command->info($count . ' nursing notes seeded.');
    }
}
