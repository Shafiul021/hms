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

    public function test_patient_cannot_view_other_patients_appointments()
    {
        $patient2User = User::factory()->create();
        $patient2User->assignRole('patient');
        $patient2 = Patient::create([
            'user_id'      => $patient2User->id,
            'patient_code' => 'HMS-2026-00002',
            'dob'          => '1995-03-15',
            'blood_type'   => 'A+',
            'gender'       => 'female',
        ]);

        $apptForPatient2 = Appointment::create([
            'patient_id' => $patient2->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => $this->date,
            'status'     => AppointmentStatus::Pending,
            'booked_by'  => $patient2User->id,
        ]);

        // Patient 1 cannot view Patient 2's appointment details
        $this->actingAs($this->patientUser, 'sanctum')
            ->getJson("/api/appointments/{$apptForPatient2->id}")
            ->assertStatus(403);

        // Patient 1 listing appointments should NOT return Patient 2's appointment
        $response = $this->actingAs($this->patientUser, 'sanctum')
            ->getJson("/api/appointments");
        
        $response->assertOk();
        $response->assertJsonMissing(['id' => $apptForPatient2->id]);
    }

    public function test_patient_cannot_see_doctors_full_appointment_list()
    {
        $patient2User = User::factory()->create();
        $patient2User->assignRole('patient');
        $patient2 = Patient::create([
            'user_id'      => $patient2User->id,
            'patient_code' => 'HMS-2026-00002',
            'dob'          => '1995-03-15',
            'blood_type'   => 'A+',
            'gender'       => 'female',
        ]);

        // Appointment for Patient 2 with the same doctor
        $apptForPatient2 = Appointment::create([
            'patient_id' => $patient2->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => $this->date,
            'status'     => AppointmentStatus::Pending,
            'booked_by'  => $patient2User->id,
        ]);

        // Patient 1 tries to list appointments filtered by doctor_id
        $response = $this->actingAs($this->patientUser, 'sanctum')
            ->getJson("/api/appointments?doctor_id={$this->doctor->id}");

        $response->assertOk();
        // Should only see their own appointments, NOT patient 2's appointment with that doctor
        $response->assertJsonMissing(['id' => $apptForPatient2->id]);
    }

    public function test_doctor_cannot_view_other_doctors_appointments()
    {
        $doctor2User = User::factory()->create();
        $doctor2User->assignRole('doctor');
        $doctor2 = Doctor::create([
            'user_id'        => $doctor2User->id,
            'specialization' => 'Cardiology',
            'qualification'  => 'MD',
            'fee'            => 1000.00,
        ]);

        $schedule2 = DoctorSchedule::where('doctor_id', $doctor2->id)
            ->where('day_of_week', 1)
            ->firstOrFail();

        $slot2 = TimeSlot::where('doctor_schedule_id', $schedule2->id)
            ->where('start_time', '09:00:00')
            ->firstOrFail();

        // Appointment with Doctor 2
        $apptForDoctor2 = Appointment::create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $doctor2->id,
            'slot_id'    => $slot2->id,
            'date'       => $this->date,
            'status'     => AppointmentStatus::Pending,
            'booked_by'  => $this->receptionist->id,
        ]);

        // Doctor 1 cannot view Doctor 2's appointment details
        $this->actingAs($this->doctorUser, 'sanctum')
            ->getJson("/api/appointments/{$apptForDoctor2->id}")
            ->assertStatus(403);

        // Doctor 1 listing appointments should NOT return Doctor 2's appointment
        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->getJson("/api/appointments");

        $response->assertOk();
        $response->assertJsonMissing(['id' => $apptForDoctor2->id]);
    }

    public function test_receptionist_can_delete_appointment()
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
            ->deleteJson("/api/appointments/{$appt->id}");

        $response->assertOk();
        $this->assertSoftDeleted('appointments', ['id' => $appt->id]);
    }
}
