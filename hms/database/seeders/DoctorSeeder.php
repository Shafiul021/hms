<?php

namespace Database\Seeders;

use App\Models\Doctor;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DoctorSeeder extends Seeder
{
    /**
     * Seed 10 doctors with linked user accounts.
     * Each doctor is assigned the 'doctor' role via Spatie.
     */
    public function run(): void
    {
        $doctors = [
            [
                'name'           => 'Dr. Arif Rahman',
                'email'          => 'arif.rahman@hms.com',
                'specialization' => 'Cardiology',
                'qualification'  => 'MBBS, MD (Cardiology)',
                'fee'            => 800.00,
                'phone'          => '+8801711000001',
                'address'        => 'Gulshan 2, Dhaka',
            ],
            [
                'name'           => 'Dr. Nusrat Islam',
                'email'          => 'nusrat.islam@hms.com',
                'specialization' => 'Neurology',
                'qualification'  => 'MBBS, MD (Neurology)',
                'fee'            => 900.00,
                'phone'          => '+8801711000002',
                'address'        => 'Banani, Dhaka',
            ],
            [
                'name'           => 'Dr. Kamal Hossain',
                'email'          => 'kamal.hossain@hms.com',
                'specialization' => 'Orthopedics',
                'qualification'  => 'MBBS, MS (Ortho)',
                'fee'            => 700.00,
                'phone'          => '+8801711000003',
                'address'        => 'Dhanmondi, Dhaka',
            ],
            [
                'name'           => 'Dr. Fahmida Akter',
                'email'          => 'fahmida.akter@hms.com',
                'specialization' => 'Gynecology',
                'qualification'  => 'MBBS, FCPS (Gynae)',
                'fee'            => 750.00,
                'phone'          => '+8801711000004',
                'address'        => 'Uttara, Dhaka',
            ],
            [
                'name'           => 'Dr. Tanvir Ahmed',
                'email'          => 'tanvir.ahmed@hms.com',
                'specialization' => 'Dermatology',
                'qualification'  => 'MBBS, DDV',
                'fee'            => 600.00,
                'phone'          => '+8801711000005',
                'address'        => 'Mirpur, Dhaka',
            ],
            [
                'name'           => 'Dr. Shamima Begum',
                'email'          => 'shamima.begum@hms.com',
                'specialization' => 'Pediatrics',
                'qualification'  => 'MBBS, DCH',
                'fee'            => 650.00,
                'phone'          => '+8801711000006',
                'address'        => 'Mohammadpur, Dhaka',
            ],
            [
                'name'           => 'Dr. Rezaul Karim',
                'email'          => 'rezaul.karim@hms.com',
                'specialization' => 'General Medicine',
                'qualification'  => 'MBBS, FCPS (Medicine)',
                'fee'            => 500.00,
                'phone'          => '+8801711000007',
                'address'        => 'Chittagong, Bangladesh',
            ],
            [
                'name'           => 'Dr. Salma Khatun',
                'email'          => 'salma.khatun@hms.com',
                'specialization' => 'Ophthalmology',
                'qualification'  => 'MBBS, DO',
                'fee'            => 550.00,
                'phone'          => '+8801711000008',
                'address'        => 'Sylhet, Bangladesh',
            ],
            [
                'name'           => 'Dr. Mahbubur Rashid',
                'email'          => 'mahbubur.rashid@hms.com',
                'specialization' => 'Psychiatry',
                'qualification'  => 'MBBS, MD (Psych)',
                'fee'            => 850.00,
                'phone'          => '+8801711000009',
                'address'        => 'Rajshahi, Bangladesh',
            ],
            [
                'name'           => 'Dr. Roksana Parvin',
                'email'          => 'roksana.parvin@hms.com',
                'specialization' => 'ENT',
                'qualification'  => 'MBBS, DLO',
                'fee'            => 600.00,
                'phone'          => '+8801711000010',
                'address'        => 'Khulna, Bangladesh',
            ],
        ];

        foreach ($doctors as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'     => $data['name'],
                    'password' => Hash::make('doctor123'),
                ]
            );

            $user->assignRole('doctor');

            Doctor::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'specialization' => $data['specialization'],
                    'qualification'  => $data['qualification'],
                    'fee'            => $data['fee'],
                    'phone'          => $data['phone'] ?? null,
                    'address'        => $data['address'] ?? null,
                ]
            );
        }

        $this->command->info(count($doctors) . ' doctors seeded.');
    }
}
