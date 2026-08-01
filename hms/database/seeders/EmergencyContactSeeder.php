<?php

namespace Database\Seeders;

use App\Models\EmergencyContact;
use App\Models\Patient;
use Illuminate\Database\Seeder;

class EmergencyContactSeeder extends Seeder
{
    /**
     * Seed one emergency contact per patient.
     */
    public function run(): void
    {
        $contacts = [
            ['name' => 'Karimul Haque',   'relationship' => 'Spouse',   'phone' => '01711-000001'],
            ['name' => 'Ruhul Amin',      'relationship' => 'Brother',  'phone' => '01711-000002'],
            ['name' => 'Nargis Begum',    'relationship' => 'Wife',     'phone' => '01711-000003'],
            ['name' => 'Farida Khanam',   'relationship' => 'Mother',   'phone' => '01711-000004'],
            ['name' => 'Rafiqul Islam',   'relationship' => 'Son',      'phone' => '01711-000005'],
            ['name' => 'Sultana Parvin',  'relationship' => 'Daughter', 'phone' => '01711-000006'],
            ['name' => 'Mominul Haque',   'relationship' => 'Father',   'phone' => '01711-000007'],
            ['name' => 'Tahmina Akter',   'relationship' => 'Sister',   'phone' => '01711-000008'],
            ['name' => 'Sirajul Islam',   'relationship' => 'Spouse',   'phone' => '01711-000009'],
            ['name' => 'Razia Begum',     'relationship' => 'Mother',   'phone' => '01711-000010'],
            ['name' => 'Aminul Hossain',  'relationship' => 'Brother',  'phone' => '01711-000011'],
            ['name' => 'Nasima Akhter',   'relationship' => 'Wife',     'phone' => '01711-000012'],
            ['name' => 'Abul Kashem',     'relationship' => 'Son',      'phone' => '01711-000013'],
            ['name' => 'Lovely Das',      'relationship' => 'Daughter', 'phone' => '01711-000014'],
            ['name' => 'Mizanur Rahman',  'relationship' => 'Father',   'phone' => '01711-000015'],
        ];

        $patients = Patient::all();

        foreach ($patients as $index => $patient) {
            if (!isset($contacts[$index])) {
                break;
            }
            EmergencyContact::firstOrCreate(
                ['patient_id' => $patient->id, 'phone' => $contacts[$index]['phone']],
                [
                    'name'         => $contacts[$index]['name'],
                    'relationship' => $contacts[$index]['relationship'],
                ]
            );
        }

        $this->command->info($patients->count() . ' emergency contacts seeded.');
    }
}
