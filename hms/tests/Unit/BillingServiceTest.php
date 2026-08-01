<?php

namespace Tests\Unit;

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\TimeSlot;
use App\Models\Appointment;
use App\Models\LabTest;
use App\Models\LabRequest;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Bill;
use App\Models\BillItem;
use App\Models\Payment;
use App\Services\BillingService;
use Hms\Core\Enums\AppointmentStatus;
use Hms\Core\Enums\BillStatus;
use Hms\Core\Enums\LabRequestStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

class BillingServiceTest extends TestCase
{
    use RefreshDatabase;

    protected BillingService $service;
    protected User $adminUser;
    protected User $doctorUser;
    protected User $patientUser;
    protected Patient $patient;
    protected Doctor $doctor;
    protected Appointment $appointment;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = new BillingService();

        foreach (['admin', 'doctor', 'receptionist', 'nurse', 'patient'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->adminUser = User::factory()->create();
        $this->adminUser->assignRole('admin');

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
            'date'       => '2026-07-20',
            'status'     => AppointmentStatus::Completed,
            'booked_by'  => $this->adminUser->id,
        ]);

        \Illuminate\Support\Facades\Queue::fake();
    }

    // ── generate() ─────────────────────────────────────────────────────────────

    public function test_generate_creates_bill_with_consultation_fee()
    {
        $bill = $this->service->generate([
            'appointment_id' => $this->appointment->id,
        ]);

        $this->assertInstanceOf(Bill::class, $bill);
        $this->assertEquals(BillStatus::Issued, $bill->status);
        $this->assertEquals(500.00, $bill->total_amount);
        $this->assertEquals(0.00, $bill->paid_amount);

        $this->assertDatabaseHas('bill_items', [
            'bill_id'   => $bill->id,
            'item_type' => 'consultation',
            'total'     => 500.00,
        ]);
    }

    public function test_generate_includes_lab_test_fees()
    {
        $labTest = LabTest::create([
            'name'             => 'CBC',
            'code'             => 'CBC-001',
            'price'            => 200.00,
            'turnaround_hours' => 24,
        ]);

        LabRequest::create([
            'appointment_id' => $this->appointment->id,
            'patient_id'     => $this->patient->id,
            'test_id'        => $labTest->id,
            'doctor_id'      => $this->doctor->id,
            'status'         => LabRequestStatus::Completed,
        ]);

        $bill = $this->service->generate([
            'appointment_id' => $this->appointment->id,
        ]);

        // 500 (consultation) + 200 (lab) = 700
        $this->assertEquals(700.00, $bill->total_amount);
        $this->assertDatabaseHas('bill_items', [
            'bill_id'   => $bill->id,
            'item_type' => 'lab',
            'total'     => 200.00,
        ]);
    }

    public function test_generate_throws_if_bill_already_exists()
    {
        $this->service->generate([
            'appointment_id' => $this->appointment->id,
        ]);

        $this->expectException(\InvalidArgumentException::class);

        $this->service->generate([
            'appointment_id' => $this->appointment->id,
        ]);
    }

    // ── recordPayment() ─────────────────────────────────────────────────────────

    public function test_record_partial_payment_updates_paid_amount_and_status()
    {
        $bill = $this->service->generate([
            'appointment_id' => $this->appointment->id,
        ]);

        // Partial payment -- 250 of 500
        $this->service->recordPayment([
            'bill_id' => $bill->id,
            'amount'  => 250.00,
            'method'  => 'cash',
        ], $this->adminUser->id);

        $bill->refresh();
        $this->assertEquals(250.00, $bill->paid_amount);
        $this->assertEquals(BillStatus::Partial, $bill->status);

        $this->assertDatabaseHas('payments', [
            'bill_id' => $bill->id,
            'amount'  => 250.00,
            'method'  => 'cash',
        ]);
    }

    public function test_record_full_payment_sets_status_to_paid()
    {
        $bill = $this->service->generate([
            'appointment_id' => $this->appointment->id,
        ]);

        $this->service->recordPayment([
            'bill_id' => $bill->id,
            'amount'  => 500.00,
            'method'  => 'card',
        ], $this->adminUser->id);

        $bill->refresh();
        $this->assertEquals(500.00, $bill->paid_amount);
        $this->assertEquals(BillStatus::Paid, $bill->status);
    }

    public function test_multiple_partial_payments_aggregate_correctly()
    {
        $bill = $this->service->generate([
            'appointment_id' => $this->appointment->id,
        ]);

        // First partial
        $this->service->recordPayment([
            'bill_id' => $bill->id,
            'amount'  => 200.00,
            'method'  => 'cash',
        ], $this->adminUser->id);

        // Second partial -- completes it
        $this->service->recordPayment([
            'bill_id' => $bill->id,
            'amount'  => 300.00,
            'method'  => 'online',
        ], $this->adminUser->id);

        $bill->refresh();
        $this->assertEquals(500.00, $bill->paid_amount);
        $this->assertEquals(BillStatus::Paid, $bill->status);
    }

    public function test_record_payment_creates_payment_record()
    {
        $bill = $this->service->generate([
            'appointment_id' => $this->appointment->id,
        ]);

        $this->service->recordPayment([
            'bill_id' => $bill->id,
            'amount'  => 150.00,
            'method'  => 'online',
        ], $this->adminUser->id);

        $this->assertDatabaseCount('payments', 1);
        $this->assertDatabaseHas('payments', [
            'bill_id' => $bill->id,
            'amount'  => 150.00,
            'method'  => 'online',
        ]);
    }
}
