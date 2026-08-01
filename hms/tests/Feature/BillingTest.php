<?php

/**
 * BillingTest — Day 40 Feature Tests
 *
 * Covers: generate bill, record payment, partial, full, PDF download
 */

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\TimeSlot;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\BillItem;
use Hms\Core\Enums\AppointmentStatus;
use Hms\Core\Enums\BillStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

class BillingTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $receptionist;
    protected User $doctorUser;
    protected User $patientUser;
    protected Patient $patient;
    protected Doctor $doctor;
    protected Appointment $appointment;

    protected function setUp(): void
    {
        parent::setUp();

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

        $slot = TimeSlot::where('doctor_schedule_id', $schedule->id)
            ->where('start_time', '09:00:00')
            ->firstOrFail();

        $this->appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $slot->id,
            'date'       => '2026-07-21',
            'status'     => AppointmentStatus::Completed,
            'booked_by'  => $this->receptionist->id,
        ]);
    }

    public function test_receptionist_can_generate_bill()
    {
        $response = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/bills/generate', [
                'appointment_id' => $this->appointment->id,
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', BillStatus::Issued->value);

        $this->assertDatabaseHas('bills', [
            'appointment_id' => $this->appointment->id,
            'patient_id'     => $this->patient->id,
        ]);
    }

    public function test_cannot_generate_duplicate_bill()
    {
        // First generation
        $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/bills/generate', [
                'appointment_id' => $this->appointment->id,
            ]);

        // Second generation should fail
        $response = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/bills/generate', [
                'appointment_id' => $this->appointment->id,
            ]);

        $response->assertStatus(422);
    }

    public function test_patient_cannot_generate_bill()
    {
        $response = $this->actingAs($this->patientUser, 'sanctum')
            ->postJson('/api/bills/generate', [
                'appointment_id' => $this->appointment->id,
            ]);

        $response->assertForbidden();
    }

    public function test_receptionist_can_record_partial_payment()
    {
        // Generate bill first
        $billResponse = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/bills/generate', [
                'appointment_id' => $this->appointment->id,
            ]);

        $billId = $billResponse->json('data.id');

        $response = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/payments', [
                'bill_id' => $billId,
                'amount'  => 250.00,
                'method'  => 'cash',
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('bills', [
            'id'          => $billId,
            'paid_amount' => 250.00,
        ]);
    }

    public function test_full_payment_sets_bill_status_to_paid()
    {
        $billResponse = $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/bills/generate', [
                'appointment_id' => $this->appointment->id,
            ]);

        $billId   = $billResponse->json('data.id');
        $totalAmt = $billResponse->json('data.total_amount');

        $this->actingAs($this->receptionist, 'sanctum')
            ->postJson('/api/payments', [
                'bill_id' => $billId,
                'amount'  => $totalAmt,
                'method'  => 'card',
            ]);

        $this->assertDatabaseHas('bills', [
            'id'     => $billId,
            'status' => BillStatus::Paid->value,
        ]);
    }

    public function test_patient_can_view_own_bill()
    {
        $bill = Bill::create([
            'patient_id'     => $this->patient->id,
            'appointment_id' => $this->appointment->id,
            'status'         => BillStatus::Issued,
            'total_amount'   => 500.00,
            'paid_amount'    => 0.00,
            'due_date'       => now()->addDays(14),
            'issued_at'      => now(),
        ]);

        $response = $this->actingAs($this->patientUser, 'sanctum')
            ->getJson("/api/bills/{$bill->id}");

        $response->assertOk();
    }

    public function test_pdf_download_returns_pdf_content_type()
    {
        $bill = Bill::create([
            'patient_id'     => $this->patient->id,
            'appointment_id' => $this->appointment->id,
            'status'         => BillStatus::Issued,
            'total_amount'   => 500.00,
            'paid_amount'    => 0.00,
            'due_date'       => now()->addDays(14),
            'issued_at'      => now(),
        ]);

        $response = $this->actingAs($this->receptionist, 'sanctum')
            ->get("/api/bills/{$bill->id}/pdf");

        $response->assertOk()
            ->assertHeader('Content-Type', 'application/pdf');
    }
}
