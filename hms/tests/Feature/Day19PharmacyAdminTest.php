<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\DoctorSchedule;
use App\Models\TimeSlot;
use App\Models\Appointment;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\Bill;
use Hms\Core\Enums\AppointmentStatus;
use Hms\Core\Enums\BedStatus;
use Hms\Core\Enums\BillStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;
use App\Jobs\LowStockAlert;
use Carbon\Carbon;

class Day19PharmacyAdminTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $receptionist;
    protected User $nurseUser;
    protected User $doctorUser;
    protected User $patientUser;
    protected Patient $patient;
    protected Doctor $doctor;
    protected Appointment $appointment;
    protected Medicine $medicine;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin', 'doctor', 'nurse', 'patient', 'receptionist'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->admin = User::factory()->create();
        $this->admin->assignRole('admin');

        $this->receptionist = User::factory()->create();
        $this->receptionist->assignRole('receptionist');

        $this->nurseUser = User::factory()->create();
        $this->nurseUser->assignRole('nurse');

        $this->doctorUser = User::factory()->create();
        $this->doctorUser->assignRole('doctor');

        $this->patientUser = User::factory()->create();
        $this->patientUser->assignRole('patient');

        $this->patient = Patient::create([
            'user_id'      => $this->patientUser->id,
            'patient_code' => 'HMS-2026-00001',
            'dob'          => '1990-01-01',
            'blood_type'   => 'A+',
            'gender'       => 'male',
        ]);

        $this->doctor = Doctor::create([
            'user_id'        => $this->doctorUser->id,
            'specialization' => 'General Medicine',
            'qualification'  => 'MD',
            'fee'            => 100.00,
        ]);

        $schedule = DoctorSchedule::where('doctor_id', $this->doctor->id)
            ->where('day_of_week', 1)->firstOrFail();
        $slot = TimeSlot::where('doctor_schedule_id', $schedule->id)->firstOrFail();

        $this->appointment = Appointment::create([
            'patient_id' => $this->patient->id,
            'doctor_id'  => $this->doctor->id,
            'slot_id'    => $slot->id,
            'date'       => '2026-06-29',
            'status'     => AppointmentStatus::Confirmed,
            'booked_by'  => $this->patientUser->id,
        ]);

        $this->medicine = Medicine::create([
            'name'            => 'Paracetamol',
            'generic_name'    => 'Acetaminophen',
            'unit'            => 'tablet',
            'price'           => 1.50,
            'stock_threshold' => 10,
        ]);
    }

    // ── Medicine Tests ──────────────────────────────────────────────────────

    public function test_admin_can_list_medicines(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/medicines')
            ->assertStatus(200)
            ->assertJsonPath('data.0.name', 'Paracetamol');
    }

    public function test_patient_cannot_list_medicines(): void
    {
        $this->actingAs($this->patientUser)
            ->getJson('/api/medicines')
            ->assertStatus(403);
    }

    public function test_admin_can_create_medicine(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/medicines', [
                'name'            => 'Amoxicillin',
                'generic_name'    => 'Amoxicillin',
                'unit'            => 'capsule',
                'price'           => 3.00,
                'stock_threshold' => 20,
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.name', 'Amoxicillin');

        $this->assertDatabaseHas('medicines', ['name' => 'Amoxicillin']);
    }

    public function test_nurse_cannot_create_medicine(): void
    {
        $this->actingAs($this->nurseUser)
            ->postJson('/api/medicines', [
                'name'            => 'X',
                'unit'            => 'tablet',
                'price'           => 1.00,
                'stock_threshold' => 5,
            ])
            ->assertStatus(403);
    }

    public function test_can_add_stock_batch_and_alert_fires_when_low(): void
    {
        Queue::fake();

        // Add a batch that keeps stock at exactly the threshold
        $this->actingAs($this->admin)
            ->patchJson("/api/medicines/{$this->medicine->id}/stock", [
                'batch_no'    => 'BATCH-001',
                'quantity'    => 10,  // equals threshold → should alert
                'expiry_date' => now()->addYear()->toDateString(),
            ])
            ->assertStatus(200);

        $this->assertDatabaseHas('medicine_batches', [
            'medicine_id' => $this->medicine->id,
            'batch_no'    => 'BATCH-001',
            'quantity'    => 10,
        ]);

        Queue::assertPushed(LowStockAlert::class);
    }

    public function test_stock_above_threshold_does_not_alert(): void
    {
        Queue::fake();

        $this->actingAs($this->admin)
            ->patchJson("/api/medicines/{$this->medicine->id}/stock", [
                'batch_no'    => 'BATCH-002',
                'quantity'    => 100,  // well above threshold of 10
                'expiry_date' => now()->addYear()->toDateString(),
            ])
            ->assertStatus(200);

        Queue::assertNotPushed(LowStockAlert::class);
    }

    // ── Dispensing Tests ─────────────────────────────────────────────────────

    public function test_pharmacist_can_dispense_prescription_with_fifo(): void
    {
        Queue::fake();

        // Create two batches: FIFO = oldest expiry first
        $batchOld = MedicineBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_no'    => 'OLD-001',
            'quantity'    => 5,
            'expiry_date' => Carbon::now()->addMonths(2)->toDateString(),
        ]);
        $batchNew = MedicineBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_no'    => 'NEW-002',
            'quantity'    => 20,
            'expiry_date' => Carbon::now()->addMonths(8)->toDateString(),
        ]);

        $prescription = Prescription::create([
            'appointment_id' => $this->appointment->id,
            'doctor_id'      => $this->doctor->id,
            'patient_id'     => $this->patient->id,
            'notes'          => 'Take with water',
        ]);
        PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'medicine_id'     => $this->medicine->id,
            'dosage'          => '500mg',
            'frequency'       => 'TID',
            'duration'        => '3 days',
        ]);

        $this->actingAs($this->nurseUser)
            ->postJson('/api/dispensings', [
                'prescription_id' => $prescription->id,
                'notes'           => 'Dispensed as prescribed',
            ])
            ->assertStatus(201);

        // FIFO: oldest batch should be deducted first (5 → 4)
        $this->assertDatabaseHas('medicine_batches', [
            'id'       => $batchOld->id,
            'quantity' => 4,
        ]);
        // Newer batch unchanged
        $this->assertDatabaseHas('medicine_batches', [
            'id'       => $batchNew->id,
            'quantity' => 20,
        ]);

        $this->assertDatabaseHas('dispensings', [
            'prescription_id' => $prescription->id,
        ]);
    }

    public function test_cannot_dispense_same_prescription_twice(): void
    {
        Queue::fake();

        MedicineBatch::create([
            'medicine_id' => $this->medicine->id,
            'batch_no'    => 'B-001',
            'quantity'    => 50,
            'expiry_date' => now()->addYear()->toDateString(),
        ]);

        $prescription = Prescription::create([
            'appointment_id' => $this->appointment->id,
            'doctor_id'      => $this->doctor->id,
            'patient_id'     => $this->patient->id,
        ]);
        PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'medicine_id'     => $this->medicine->id,
            'dosage'          => '250mg',
            'frequency'       => 'BD',
            'duration'        => '5 days',
        ]);

        // First dispense — should succeed
        $this->actingAs($this->nurseUser)
            ->postJson('/api/dispensings', ['prescription_id' => $prescription->id])
            ->assertStatus(201);

        // Second dispense — should fail
        $this->actingAs($this->nurseUser)
            ->postJson('/api/dispensings', ['prescription_id' => $prescription->id])
            ->assertStatus(422)
            ->assertJsonPath('message', 'This prescription has already been dispensed.');
    }

    public function test_dispense_fails_on_insufficient_stock(): void
    {
        // No batches — stock is zero
        $prescription = Prescription::create([
            'appointment_id' => $this->appointment->id,
            'doctor_id'      => $this->doctor->id,
            'patient_id'     => $this->patient->id,
        ]);
        PrescriptionItem::create([
            'prescription_id' => $prescription->id,
            'medicine_id'     => $this->medicine->id,
            'dosage'          => '500mg',
            'frequency'       => 'OD',
            'duration'        => '1 day',
        ]);

        $this->actingAs($this->nurseUser)
            ->postJson('/api/dispensings', ['prescription_id' => $prescription->id])
            ->assertStatus(422)
            ->assertJsonPath('message', fn ($v) => str_contains($v, 'Insufficient stock'));
    }

    // ── Admin Dashboard Tests ─────────────────────────────────────────────

    public function test_admin_stats_endpoint(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/stats')
            ->assertStatus(200)
            ->assertJsonStructure([
                'total_patients',
                'total_doctors',
                'appointments_today',
                'revenue_this_month',
                'available_beds',
                'occupied_beds',
            ]);
    }

    public function test_non_admin_cannot_access_stats(): void
    {
        $this->actingAs($this->patientUser)
            ->getJson('/api/admin/stats')
            ->assertStatus(403);
    }

    public function test_appointment_trend_returns_data(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/appointments/trend')
            ->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_revenue_trend_returns_data(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/revenue/trend')
            ->assertStatus(200)
            ->assertJsonStructure(['data']);
    }

    public function test_bed_occupancy_returns_per_ward_data(): void
    {
        Ward::create([
            'name'       => 'Test Ward',
            'type'       => 'general',
            'capacity'   => 4,
            'daily_rate' => 200.00,
        ]);

        $this->actingAs($this->admin)
            ->getJson('/api/admin/bed-occupancy')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => [['ward', 'type', 'available', 'occupied', 'maintenance', 'total']]]);
    }

    // ── Admin User Management Tests ───────────────────────────────────────

    public function test_admin_can_list_staff_users(): void
    {
        $this->actingAs($this->admin)
            ->getJson('/api/admin/users')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta']);
    }

    public function test_admin_can_create_staff_account(): void
    {
        $this->actingAs($this->admin)
            ->postJson('/api/admin/users', [
                'name'     => 'New Receptionist',
                'email'    => 'recept@hms.com',
                'password' => 'password123',
                'role'     => 'receptionist',
            ])
            ->assertStatus(201)
            ->assertJsonPath('data.roles.0', 'receptionist');

        $this->assertDatabaseHas('users', ['email' => 'recept@hms.com']);
    }

    public function test_admin_can_change_user_role(): void
    {
        $this->actingAs($this->admin)
            ->patchJson("/api/admin/users/{$this->doctorUser->id}/role", [
                'role' => 'admin',
            ])
            ->assertStatus(200)
            ->assertJsonPath('data.roles.0', 'admin');
    }

    public function test_patient_cannot_access_admin_user_management(): void
    {
        $this->actingAs($this->patientUser)
            ->getJson('/api/admin/users')
            ->assertStatus(403);
    }
}
