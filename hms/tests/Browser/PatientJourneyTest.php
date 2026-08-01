<?php

namespace Tests\Browser;

use App\Models\User;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\TimeSlot;
use App\Models\DoctorSchedule;
use Illuminate\Foundation\Testing\DatabaseMigrations;
use Laravel\Dusk\Browser;
use Tests\DuskTestCase;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

class PatientJourneyTest extends DuskTestCase
{
    /**
     * Test the full patient journey lifecycle.
     */
    public function test_full_patient_journey(): void
    {
        // 1. Setup users & data programmatically
        // Roles
        $adminRole = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $recRole = Role::firstOrCreate(['name' => 'receptionist', 'guard_name' => 'web']);
        $docRole = Role::firstOrCreate(['name' => 'doctor', 'guard_name' => 'web']);
        $patRole = Role::firstOrCreate(['name' => 'patient', 'guard_name' => 'web']);

        // Receptionist
        $receptionist = User::firstOrCreate(
            ['email' => 'receptionist.test@hms.com'],
            [
                'name' => 'Test Receptionist',
                'password' => Hash::make('password123'),
            ]
        );
        $receptionist->assignRole('receptionist');

        // Doctor
        $doctorUser = User::firstOrCreate(
            ['email' => 'doctor.test@hms.com'],
            [
                'name' => 'Test Doctor',
                'password' => Hash::make('password123'),
            ]
        );
        $doctorUser->assignRole('doctor');

        $doctor = Doctor::firstOrCreate(
            ['user_id' => $doctorUser->id],
            [
                'specialization' => 'General Medicine',
                'qualification' => 'MBBS',
                'fee' => 500.00,
            ]
        );

        // Schedule & slot
        $schedule = DoctorSchedule::firstOrCreate(
            [
                'doctor_id' => $doctor->id,
                'day_of_week' => 1, // Monday
            ],
            [
                'is_active' => true,
            ]
        );

        $timeSlot = TimeSlot::firstOrCreate(
            [
                'doctor_schedule_id' => $schedule->id,
                'start_time'         => '10:00:00',
            ],
            [
                'end_time'           => '10:30:00',
                'is_blocked'         => false,
            ]
        );

        // Admin
        $admin = User::firstOrCreate(
            ['email' => 'admin.test@hms.com'],
            [
                'name' => 'Test Admin',
                'password' => Hash::make('password123'),
            ]
        );
        $admin->assignRole('admin');

        $this->browse(function (Browser $browser) use ($receptionist, $doctorUser, $admin) {
            // Define unique suffix for this test run to avoid validation duplication
            $uniqueId = rand(1000, 9999);
            $patientName = "Test Patient " . $uniqueId;
            $patientEmail = "patient." . $uniqueId . "@hms.com";

            // ── Phase 1: Receptionist Registers Patient & Books Appointment ──
            $browser->visit('/login')
                ->waitFor('input[type="email"]')
                ->type('input[type="email"]', $receptionist->email)
                ->type('input[type="password"]', 'password123')
                ->click('button[type="submit"]')
                ->waitForLocation('/dashboard')
                ->assertSee('Receptionist Dashboard')
                
                // Go to patients register page
                ->clickLink('Patients')
                ->waitForLocation('/patients')
                ->clickLink('Register Patient')
                ->waitForLocation('/patients/new')
                
                // Fill patient form
                ->type('input[name="name"]', $patientName)
                ->type('input[name="email"]', $patientEmail)
                ->type('input[name="password"]', 'password123')
                ->type('input[type="date"]', '1990-01-01')
                ->select('select[name="gender"]', 'male')
                ->select('select[name="bloodType"]', 'O+')
                ->type('input[name="phone"]', '17123456' . rand(10, 99))
                ->type('textarea[name="address"]', 'Dhaka, Bangladesh')
                ->press('Register Patient')
                ->waitForLocation('/patients')
                ->assertSee($patientName)

                // Book an appointment for the new patient
                ->visit('/appointments/book')
                ->waitForText('Book New Appointment')
                // Step 1: Select Doctor (We search and click doctor.test@hms.com)
                ->type('input[placeholder*="Search by name"]', 'Test Doctor')
                ->waitForText('Test Doctor')
                ->click('button:contains("Test Doctor")')
                ->press('Next')
                // Step 2: Pick Date & Slot (Select next Monday's date)
                ->type('input[type="date"]', date('Y-m-d', strtotime('next Monday')))
                ->waitForText('10:00:00')
                ->press('10:00:00')
                ->press('Next')
                // Step 3: Confirm with Book on Behalf dropdown
                ->waitForText('Book on Behalf of Patient')
                ->select('select', $patientName)
                ->type('textarea', 'Routine checkup for cough.')
                ->press('Confirm Booking')
                ->waitForLocation('/appointments')
                ->assertSee($patientName)

                // Log out
                ->click('#logout-btn')
                ->waitForLocation('/login');

            // ── Phase 2: Doctor Consults Patient ──
            $browser->visit('/login')
                ->type('input[type="email"]', $doctorUser->email)
                ->type('input[type="password"]', 'password123')
                ->click('button[type="submit"]')
                ->waitForLocation('/dashboard')
                ->assertSee('Doctor Dashboard')
                ->assertSee($patientName)
                ->click('button:contains("Consult")')
                ->waitForText('Start Consultation')
                ->type('textarea[name="diagnosis"]', 'Viral fever and mild throat infection.')
                ->type('textarea[name="prescription"]', 'Paracetamol 500mg - thrice daily for 3 days.')
                ->press('Save Consultation')
                ->waitForLocation('/appointments')
                ->assertSee('Completed')

                // Log out
                ->click('#logout-btn')
                ->waitForLocation('/login');

            // ── Phase 3: Admin Pays Bill ──
            $browser->visit('/login')
                ->type('input[type="email"]', $admin->email)
                ->type('input[type="password"]', 'password123')
                ->click('button[type="submit"]')
                ->waitForLocation('/dashboard')
                ->assertSee('Admin Dashboard')
                ->clickLink('Billing')
                ->waitForLocation('/billing')
                ->assertSee($patientName)
                ->click('tr:contains("' . $patientName . '")')
                ->waitForText('Unpaid')
                ->press('Collect Payment')
                ->waitForText('Confirm Payment Collection')
                ->press('Confirm')
                ->waitForText('Paid')
                
                // Clean up / Sign out
                ->click('#logout-btn')
                ->waitForLocation('/login');
        });
    }
}
