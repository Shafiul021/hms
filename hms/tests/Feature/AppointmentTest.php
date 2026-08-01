<?php

/**
 * AppointmentTest — Day 40 Feature Tests
 *
 * Covers: book, confirm, in_progress, complete, cancel, double-book (422)
 * These are thin integration tests that call the API endpoints end-to-end.
 */

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\TimeSlot;
use App\Models\Appointment;
use Hms\Core\Enums\AppointmentStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

class AppointmentTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $receptionist;
    protected User $doctorUser;
    protected User $patientUser;
    protected Patient $patient;
    protected Doctor $doctor;
    protected TimeSlot $slot;
    protected string $date;

    protected function setUp(): void
    {
        parent::setUp();
        $this->date = date('Y-m-d', strtotime('next Monday'));

        Queue::fake();

        foreach (['admin', 'doctor', 'receptionist', 'nurse', 'patient'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->receptionist = User::factory()->create();
        $this->receptionist->assignRole('receptionist');

        $this->doctorUser = User::factory()->create();
        $this->doctorUser->assignRole('doctor');

        $this->patientUser = User::factory()->create();
        $this->patientUser->assignRole('patient');

        $this->patient = Patient::create([
            'user_id'      => $this->patientUser->id,
            'patient_code' => 'HMS-2026-00001',
            'dob'          => '1990-01-01',
            'blood_type'   => 'O+',
            'gender'       => 'male',
        ]);

        $this->doctor = Doctor::create([
            'user_id'        => $this->doctorUser->id,
            'specialization' => 'General Medicine',
            'qualification'  => 'MBBS',
            'fee'            => 500.00,
        ]);

        $schedule = DoctorSchedule::where('doctor_id', $this->doctor->id)
            ->where('day_of_week', 1)
            ->firstOrFail();

        $this->slot = TimeSlot::where('doctor_schedule_id', $schedule->id)
            ->where('start_time', '09:00:00')
            ->firstOrFail();
    }

    public function test_receptionist_can_book_appointment()
    {
        $response = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/appointments', [
                'patient_id' => $this->patient->id,
                'doctor_id'  => $this->doctor->id,
                'slot_id'    => $this->slot->id,
                'date'       => $this->date,
                'notes'      => 'Routine checkup',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', AppointmentStatus::Pending->value);
    }

    public function test_double_booking_same_slot_returns_422()
    {
        // First booking
        $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/appointments', [
                'patient_id' => $this->patient->id,
                'doctor_id'  => $this->doctor->id,
                'slot_id'    => $this->slot->id,
                'date'       => $this->date,
            ]);

        // Second patient trying same slot + date
        $patient2User = User::factory()->create();
        $patient2User->assignRole('patient');
        $patient2 = Patient::create([
            'user_id'      => $patient2User->id,
            'patient_code' => 'HMS-2026-00002',
            'dob'          => '1995-03-15',
            'blood_type'   => 'A+',
            'gender'       => 'female',
        ]);

        $response = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/appointments', [
                'patient_id' => $patient2->id,
                'doctor_id'  => $this->doctor->id,
                'slot_id'    => $this->slot->id,
                'date'       => $this->date,
            ]);

        $response->assertStatus(422);
    }

    public function test_receptionist_can_confirm_appointment()
    {
        $appt = Appointment::create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => $this->date,
            'status'     => AppointmentStatus::Pending,
            'booked_by'  => $this->receptionist->id,
        ]);

        $response = $this->actingAs($this->receptionist, 'sanctum')
            ->patchJson("/api/appointments/{$appt->id}/status", [
                'status' => AppointmentStatus::Confirmed->value,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::Confirmed->value);
    }

    public function test_doctor_can_mark_in_progress()
    {
        $appt = Appointment::create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => $this->date,
            'status'     => AppointmentStatus::Confirmed,
            'booked_by'  => $this->receptionist->id,
        ]);

        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->patchJson("/api/appointments/{$appt->id}/status", [
                'status' => AppointmentStatus::InProgress->value,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::InProgress->value);
    }

    public function test_doctor_can_complete_appointment()
    {
        $appt = Appointment::create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => $this->date,
            'status'     => AppointmentStatus::InProgress,
            'booked_by'  => $this->receptionist->id,
        ]);

        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->patchJson("/api/appointments/{$appt->id}/status", [
                'status' => AppointmentStatus::Completed->value,
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', AppointmentStatus::Completed->value);
    }

    public function test_patient_can_cancel_own_appointment()
    {
        $appt = Appointment::create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => $this->date,
            'status'     => AppointmentStatus::Pending,
            'booked_by'  => $this->patientUser->id,
        ]);

        $response = $this->actingAs($this->patientUser, 'sanctum')
            ->deleteJson("/api/appointments/{$appt->id}");

        $response->assertOk();
    }
}
