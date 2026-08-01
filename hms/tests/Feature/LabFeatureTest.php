<?php

/**
 * LabTest — Day 40 Feature Tests
 *
 * Covers: request test, upload result, view result
 */

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\TimeSlot;
use App\Models\Appointment;
use App\Models\LabTest;
use App\Models\LabRequest;
use App\Models\LabResult;
use Hms\Core\Enums\AppointmentStatus;
use Hms\Core\Enums\LabRequestStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Spatie\Permission\Models\Role;

class LabFeatureTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $doctorUser;
    protected User $nurseUser;
    protected User $patientUser;
    protected Patient $patient;
    protected Doctor $doctor;
    protected Appointment $appointment;
    protected LabTest $labTest;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();
        Storage::fake('local');

        foreach (['admin', 'doctor', 'receptionist', 'nurse', 'patient'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->doctorUser = User::factory()->create();
        $this->doctorUser->assignRole('doctor');

        $this->nurseUser = User::factory()->create();
        $this->nurseUser->assignRole('nurse');

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

        $slot = TimeSlot::where('doctor_schedule_id', $schedule->id)
            ->where('start_time', '09:00:00')
            ->firstOrFail();

        $this->appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $slot->id,
            'date'       => '2026-07-21',
            'status'     => AppointmentStatus::InProgress,
            'booked_by'  => $this->admin->id,
        ]);

        $this->labTest = LabTest::create([
            'name'             => 'Complete Blood Count',
            'code'             => 'CBC-001',
            'price'            => 250.00,
            'turnaround_hours' => 24,
        ]);
    }

    public function test_doctor_can_request_lab_test()
    {
        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->postJson('/api/lab-requests', [
                'appointment_id' => $this->appointment->id,
                'test_id'        => $this->labTest->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', LabRequestStatus::Requested->value);
    }

    public function test_lab_request_defaults_to_requested_status()
    {
        $this->actingAs($this->doctorUser, 'sanctum')
            ->postJson('/api/lab-requests', [
                'appointment_id' => $this->appointment->id,
                'test_id'        => $this->labTest->id,
            ]);

        $this->assertDatabaseHas('lab_requests', [
            'appointment_id' => $this->appointment->id,
            'test_id'        => $this->labTest->id,
            'status'         => LabRequestStatus::Requested->value,
        ]);
    }

    public function test_nurse_can_upload_lab_result()
    {
        $labRequest = LabRequest::create([
            'appointment_id' => $this->appointment->id,
            'patient_id'     => $this->patient->id,
            'test_id'        => $this->labTest->id,
            'doctor_id'      => $this->doctor->id,
            'status'         => LabRequestStatus::Requested,
        ]);

        $file = UploadedFile::fake()->create('result.pdf', 100, 'application/pdf');

        $response = $this->actingAs($this->nurseUser, 'sanctum')
            ->patchJson("/api/lab-results/{$labRequest->id}", [
                'result_file' => $file,
                'notes'       => 'All values within normal range.',
                'is_abnormal' => false,
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('lab_requests', [
            'id'     => $labRequest->id,
            'status' => LabRequestStatus::Completed->value,
        ]);
    }

    public function test_doctor_can_view_lab_result()
    {
        $labRequest = LabRequest::create([
            'appointment_id' => $this->appointment->id,
            'patient_id'     => $this->patient->id,
            'test_id'        => $this->labTest->id,
            'doctor_id'      => $this->doctor->id,
            'status'         => LabRequestStatus::Completed,
        ]);

        LabResult::create([
            'lab_request_id' => $labRequest->id,
            'technician_id'  => $this->nurseUser->id,
            'result_file'    => 'lab-results/test.pdf',
            'notes'          => 'Normal results',
            'is_abnormal'    => false,
        ]);

        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->getJson("/api/lab-results/{$labRequest->id}");

        $response->assertOk();
    }

    public function test_abnormal_result_is_flagged()
    {
        $labRequest = LabRequest::create([
            'appointment_id' => $this->appointment->id,
            'patient_id'     => $this->patient->id,
            'test_id'        => $this->labTest->id,
            'doctor_id'      => $this->doctor->id,
            'status'         => LabRequestStatus::Requested,
        ]);

        $file = UploadedFile::fake()->create('result.pdf', 100, 'application/pdf');

        $response = $this->actingAs($this->nurseUser, 'sanctum')
            ->patchJson("/api/lab-results/{$labRequest->id}", [
                'result_file' => $file,
                'notes'       => 'High WBC count detected.',
                'is_abnormal' => true,
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('lab_results', [
            'lab_request_id' => $labRequest->id,
            'is_abnormal'    => 1,
        ]);
    }
}
