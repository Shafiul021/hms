<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\TimeSlot;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\LabResult;
use App\Models\LabRequest;
use App\Models\LabTest;
use Hms\Core\Enums\AppointmentStatus;
use Hms\Core\Enums\BillStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Broadcast;
use Spatie\Permission\Models\Role;

class Day20BroadcastingPoliciesTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $receptionist;
    protected User $doctorUser;
    protected User $patientUser1;
    protected User $patientUser2;
    protected Patient $patient1;
    protected Patient $patient2;
    protected Doctor $doctor;
    protected TimeSlot $slot;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed roles
        foreach (['admin', 'doctor', 'nurse', 'patient', 'receptionist'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->receptionist = User::factory()->create();
        $this->receptionist->assignRole('receptionist');

        $this->doctorUser = User::factory()->create();
        $this->doctorUser->assignRole('doctor');

        $this->patientUser1 = User::factory()->create();
        $this->patientUser1->assignRole('patient');

        $this->patientUser2 = User::factory()->create();
        $this->patientUser2->assignRole('patient');

        $this->patient1 = Patient::create([
            'user_id'      => $this->patientUser1->id,
            'patient_code' => 'HMS-P-1',
            'dob'          => '1990-01-01',
            'blood_type'   => 'A+',
            'gender'       => 'male',
        ]);

        $this->patient2 = Patient::create([
            'user_id'      => $this->patientUser2->id,
            'patient_code' => 'HMS-P-2',
            'dob'          => '1992-02-02',
            'blood_type'   => 'B+',
            'gender'       => 'female',
        ]);

        $this->doctor = Doctor::create([
            'user_id'        => $this->doctorUser->id,
            'specialization' => 'Cardiology',
            'qualification'  => 'MD',
            'fee'            => 150.00,
        ]);

        $schedule = DoctorSchedule::where('doctor_id', $this->doctor->id)->firstOrFail();
        $this->slot = TimeSlot::where('doctor_schedule_id', $schedule->id)->firstOrFail();
    }

    // ── Policy: Appointment Tests ───────────────────────────────────────────

    public function test_patient_can_view_own_appointment_but_not_others(): void
    {
        $app1 = Appointment::create([
            'patient_id' => $this->patient1->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => '2026-06-29',
            'status'     => AppointmentStatus::Confirmed,
            'booked_by'  => $this->patientUser1->id,
        ]);

        // Patient 1 can view
        $this->actingAs($this->patientUser1)
            ->getJson("/api/appointments/{$app1->id}")
            ->assertStatus(200);

        // Patient 2 cannot view
        $this->actingAs($this->patientUser2)
            ->getJson("/api/appointments/{$app1->id}")
            ->assertStatus(403);
    }

    // ── Policy: Bill Tests ──────────────────────────────────────────────────

    public function test_patient_can_view_own_bill_but_not_others(): void
    {
        $app = Appointment::create([
            'patient_id' => $this->patient1->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => '2026-06-29',
            'status'     => AppointmentStatus::Confirmed,
            'booked_by'  => $this->patientUser1->id,
        ]);

        $bill = Bill::create([
            'patient_id'     => $this->patient1->id,
            'appointment_id' => $app->id,
            'total_amount'   => 100.00,
            'paid_amount'    => 0,
            'status'         => BillStatus::Draft,
            'issued_at'      => now(),
            'due_date'       => now()->addWeek()->toDateString(),
        ]);

        // Patient 1 can view
        $this->actingAs($this->patientUser1)
            ->getJson("/api/bills/{$bill->id}")
            ->assertStatus(200);

        // Patient 2 cannot view
        $this->actingAs($this->patientUser2)
            ->getJson("/api/bills/{$bill->id}")
            ->assertStatus(403);
    }

    // ── Policy: Lab Result Tests ────────────────────────────────────────────

    public function test_patient_can_view_own_lab_result_but_not_others(): void
    {
        $app = Appointment::create([
            'patient_id' => $this->patient1->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => '2026-06-29',
            'status'     => AppointmentStatus::Confirmed,
            'booked_by'  => $this->patientUser1->id,
        ]);

        $test = LabTest::create(['code' => 'T-100', 'name' => 'CBC', 'price' => 50, 'turnaround_hours' => 24]);
        
        $req = LabRequest::create([
            'appointment_id' => $app->id,
            'patient_id'     => $this->patient1->id,
            'doctor_id'      => $this->doctor->id,
            'test_id'        => $test->id,
        ]);

        $res = LabResult::create([
            'lab_request_id' => $req->id,
            'technician_id'  => $this->admin->id,
            'result_file'    => 'results/test-cbc.pdf',
            'is_abnormal'    => false,
        ]);

        // Patient 1 can view
        $this->actingAs($this->patientUser1)
            ->getJson("/api/lab-results/{$res->id}")
            ->assertStatus(200);

        // Patient 2 cannot view
        $this->actingAs($this->patientUser2)
            ->getJson("/api/lab-results/{$res->id}")
            ->assertStatus(403);
    }

    // ── Observer: Appointment Audit Logging ─────────────────────────────────

    public function test_appointment_observer_creates_logs(): void
    {
        $app = Appointment::create([
            'patient_id' => $this->patient1->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $this->slot->id,
            'date'       => '2026-06-29',
            'status'     => AppointmentStatus::Pending,
            'booked_by'  => $this->patientUser1->id,
        ]);

        // Assert booking log was created
        $this->assertDatabaseHas('appointment_logs', [
            'appointment_id' => $app->id,
            'old_status'     => null,
            'new_status'     => AppointmentStatus::Pending->value,
        ]);

        // Update status using a route/service or direct attribute update
        $this->actingAs($this->admin)
            ->patchJson("/api/appointments/{$app->id}/status", [
                'status' => AppointmentStatus::Confirmed->value,
            ])
            ->assertStatus(200);

        // Assert state-change transition audit log is generated
        $this->assertDatabaseHas('appointment_logs', [
            'appointment_id' => $app->id,
            'old_status'     => AppointmentStatus::Pending->value,
            'new_status'     => AppointmentStatus::Confirmed->value,
        ]);
    }

    // ── Broadcasting Channel Authorization ──────────────────────────────────

    public function test_broadcasting_auth_endpoints(): void
    {
        $broadcaster = \Illuminate\Support\Facades\Broadcast::driver();
        $channels = $broadcaster->getChannels();

        // 1. App.Models.User.{id} callback check
        $userCallback = $channels['App.Models.User.{id}'];
        $this->assertTrue($userCallback($this->patientUser1, $this->patientUser1->id));
        $this->assertFalse($userCallback($this->patientUser1, $this->patientUser2->id));

        // 2. patient.{patientId} callback check
        $patientCallback = $channels['patient.{patientId}'];
        $this->assertTrue($patientCallback($this->patientUser1, $this->patient1->id));
        $this->assertFalse($patientCallback($this->patientUser2, $this->patient1->id));
        $this->assertTrue($patientCallback($this->admin, $this->patient1->id)); // Admin bypass check
        $this->assertTrue($patientCallback($this->doctorUser, $this->patient1->id)); // Doctor bypass check

        // 3. doctor.{doctorId} callback check
        $doctorCallback = $channels['doctor.{doctorId}'];
        $this->assertTrue($doctorCallback($this->doctorUser, $this->doctor->id));
        $this->assertFalse($doctorCallback($this->patientUser1, $this->doctor->id));
        $this->assertTrue($doctorCallback($this->admin, $this->doctor->id)); // Admin bypass check

        // 4. admin callback check
        $adminCallback = $channels['admin'];
        $this->assertTrue($adminCallback($this->admin));
        $this->assertFalse($adminCallback($this->patientUser1));
    }
}
