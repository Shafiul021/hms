<?php

namespace Database\Seeders;

use App\Models\Patient;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PatientSeeder extends Seeder
{
    /**
     * Seed 15 patients with linked user accounts.
     * Each patient is assigned the 'patient' role via Spatie.
     */
    public function run(): void
    {
        $patients = [
            ['name' => 'Mohammad Rahim',    'email' => 'rahim@patient.hms.com',    'dob' => '1985-03-12', 'gender' => 'male',   'blood_type' => 'B+',  'code' => 'PAT-0001', 'phone' => '+8801711223344', 'address' => 'Mirpur, Dhaka'],
            ['name' => 'Fatema Khanam',     'email' => 'fatema@patient.hms.com',   'dob' => '1992-07-25', 'gender' => 'female', 'blood_type' => 'A+',  'code' => 'PAT-0002', 'phone' => '+8801811223344', 'address' => 'Gulshan, Dhaka'],
            ['name' => 'Abdul Karim',       'email' => 'akarim@patient.hms.com',   'dob' => '1978-11-03', 'gender' => 'male',   'blood_type' => 'O+',  'code' => 'PAT-0003', 'phone' => '+8801911223344', 'address' => 'Dhanmondi, Dhaka'],
            ['name' => 'Nasrin Akter',      'email' => 'nasrin@patient.hms.com',   'dob' => '2000-01-18', 'gender' => 'female', 'blood_type' => 'AB+', 'code' => 'PAT-0004', 'phone' => '+8801511223344', 'address' => 'Uttara, Dhaka'],
            ['name' => 'Jahirul Islam',     'email' => 'jahir@patient.hms.com',    'dob' => '1965-06-09', 'gender' => 'male',   'blood_type' => 'B-',  'code' => 'PAT-0005', 'phone' => '+8801311223344', 'address' => 'Banani, Dhaka'],
            ['name' => 'Sharmin Sultana',   'email' => 'sharmin@patient.hms.com',  'dob' => '1990-09-14', 'gender' => 'female', 'blood_type' => 'O-',  'code' => 'PAT-0006', 'phone' => '+8801411223344', 'address' => 'Mohammadpur, Dhaka'],
            ['name' => 'Rakibul Hasan',     'email' => 'rakib@patient.hms.com',    'dob' => '2003-04-22', 'gender' => 'male',   'blood_type' => 'A-',  'code' => 'PAT-0007', 'phone' => '+8801722334455', 'address' => 'Chittagong, Bangladesh'],
            ['name' => 'Sumaiya Begum',     'email' => 'sumaiya@patient.hms.com',  'dob' => '1998-12-30', 'gender' => 'female', 'blood_type' => 'B+',  'code' => 'PAT-0008', 'phone' => '+8801822334455', 'address' => 'Sylhet, Bangladesh'],
            ['name' => 'Moniruzzaman',      'email' => 'monir@patient.hms.com',    'dob' => '1955-08-17', 'gender' => 'male',   'blood_type' => 'AB-', 'code' => 'PAT-0009', 'phone' => '+8801922334455', 'address' => 'Rajshahi, Bangladesh'],
            ['name' => 'Tania Hoque',       'email' => 'tania@patient.hms.com',    'dob' => '1987-02-05', 'gender' => 'female', 'blood_type' => 'O+',  'code' => 'PAT-0010', 'phone' => '+8801522334455', 'address' => 'Khulna, Bangladesh'],
            ['name' => 'Saiful Islam',      'email' => 'saiful@patient.hms.com',   'dob' => '1970-05-28', 'gender' => 'male',   'blood_type' => 'A+',  'code' => 'PAT-0011', 'phone' => '+8801322334455', 'address' => 'Barisal, Bangladesh'],
            ['name' => 'Moriam Khatun',     'email' => 'moriam@patient.hms.com',   'dob' => '1995-10-11', 'gender' => 'female', 'blood_type' => 'B+',  'code' => 'PAT-0012', 'phone' => '+8801422334455', 'address' => 'Comilla, Bangladesh'],
            ['name' => 'Habibur Rahman',    'email' => 'habib@patient.hms.com',    'dob' => '1960-07-04', 'gender' => 'male',   'blood_type' => 'O+',  'code' => 'PAT-0013', 'phone' => '+8801733445566', 'address' => 'Rangpur, Bangladesh'],
            ['name' => 'Shila Rani Das',    'email' => 'shila@patient.hms.com',    'dob' => '1983-03-19', 'gender' => 'female', 'blood_type' => 'A+',  'code' => 'PAT-0014', 'phone' => '+8801833445566', 'address' => 'Mymensingh, Bangladesh'],
            ['name' => 'Tariqul Hasan',     'email' => 'tariq@patient.hms.com',    'dob' => '2005-11-01', 'gender' => 'male',   'blood_type' => 'B+',  'code' => 'PAT-0015', 'phone' => '+8801933445566', 'address' => 'Jessore, Bangladesh'],
        ];

        foreach ($patients as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'     => $data['name'],
                    'password' => Hash::make('patient123'),
                ]
            );

            $user->assignRole('patient');

            Patient::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'dob'        => $data['dob'],
                    'gender'     => $data['gender'],
                    'blood_type' => $data['blood_type'],
                    'phone'      => $data['phone'] ?? null,
                    'address'    => $data['address'] ?? null,
                ]
            );
        }

        $this->command->info(count($patients) . ' patients seeded.');
    }
}
