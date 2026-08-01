<?php

/**
 * IpdTest — Day 40 Feature Tests
 *
 * Covers: admit patient, discharge, add nursing note
 */

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Patient;
use App\Models\Doctor;
use App\Models\Ward;
use App\Models\Bed;
use App\Models\Admission;
use App\Models\NursingNote;
use Hms\Core\Enums\BedStatus;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Queue;
use Spatie\Permission\Models\Role;

class IpdTest extends TestCase
{
    use RefreshDatabase;

    protected User $admin;
    protected User $doctorUser;
    protected User $nurseUser;
    protected User $patientUser;
    protected Patient $patient;
    protected Doctor $doctor;
    protected Ward $ward;
    protected Bed $bed;

    protected function setUp(): void
    {
        parent::setUp();

        Queue::fake();

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

        $this->ward = Ward::create([
            'name'       => 'General Ward',
            'type'       => 'general',
            'capacity'   => 10,
            'daily_rate' => 1000.00,
        ]);

        $this->bed = Bed::create([
            'ward_id'    => $this->ward->id,
            'bed_number' => 'G-01',
            'status'     => BedStatus::Available,
        ]);
    }

    public function test_doctor_can_admit_patient()
    {
        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->postJson('/api/admissions', [
                'patient_id' => $this->patient->id,
                'doctor_id'  => $this->doctor->id,
                'bed_id'     => $this->bed->id,
                'reason'     => 'Admitted for observation.',
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('beds', [
            'id'     => $this->bed->id,
            'status' => BedStatus::Occupied->value,
        ]);
    }

    public function test_cannot_admit_to_occupied_bed()
    {
        // Admit first patient
        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->postJson('/api/admissions', [
                'patient_id' => $this->patient->id,
                'doctor_id'  => $this->doctor->id,
                'bed_id'     => $this->bed->id,
                'reason'     => 'First patient.',
            ]);

        // Create second patient
        $patient2User = User::factory()->create();
        $patient2User->assignRole('patient');
        $patient2 = Patient::create([
            'user_id'      => $patient2User->id,
            'patient_code' => 'HMS-2026-00002',
            'dob'          => '1995-03-15',
            'blood_type'   => 'A+',
            'gender'       => 'female',
        ]);

        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->postJson('/api/admissions', [
                'patient_id' => $patient2->id,
                'doctor_id'  => $this->doctor->id,
                'bed_id'     => $this->bed->id,
                'reason'     => 'Should fail.',
            ]);

        $response->assertStatus(422);
    }

    public function test_doctor_can_discharge_patient()
    {
        $admission = Admission::create([
            'patient_id'  => $this->patient->id,
            'doctor_id'   => $this->doctor->id,
            'bed_id'      => $this->bed->id,
            'reason'      => 'Observation required.',
            'admitted_at' => now()->subDays(2),
        ]);
        $this->bed->update(['status' => BedStatus::Occupied]);

        $response = $this->actingAs($this->doctorUser, 'sanctum')
            ->patchJson("/api/admissions/{$admission->id}/discharge");

        $response->assertOk();

        $this->assertDatabaseHas('beds', [
            'id'     => $this->bed->id,
            'status' => BedStatus::Available->value,
        ]);

        $this->assertNotNull(Admission::find($admission->id)->discharged_at);
    }

    public function test_nurse_can_add_nursing_note()
    {
        $admission = Admission::create([
            'patient_id'  => $this->patient->id,
            'doctor_id'   => $this->doctor->id,
            'bed_id'      => $this->bed->id,
            'reason'      => 'Monitoring required.',
            'admitted_at' => now()->subDay(),
        ]);

        $response = $this->actingAs($this->nurseUser, 'sanctum')
            ->postJson("/api/admissions/{$admission->id}/notes", [
                'note' => 'Patient vitals stable. Temperature 37°C.',
            ]);

        $response->assertCreated();

        $this->assertDatabaseHas('nursing_notes', [
            'admission_id' => $admission->id,
        ]);
    }

    public function test_can_list_nursing_notes_chronologically()
    {
        $admission = Admission::create([
            'patient_id'  => $this->patient->id,
            'doctor_id'   => $this->doctor->id,
            'bed_id'      => $this->bed->id,
            'reason'      => 'Extended care.',
            'admitted_at' => now()->subDays(3),
        ]);

        NursingNote::create([
            'admission_id' => $admission->id,
            'nurse_id'     => $this->nurseUser->id,
            'note'         => 'Note 1 — morning vitals',
        ]);
        NursingNote::create([
            'admission_id' => $admission->id,
            'nurse_id'     => $this->nurseUser->id,
            'note'         => 'Note 2 — afternoon check',
        ]);

        $response = $this->actingAs($this->nurseUser, 'sanctum')
            ->getJson("/api/admissions/{$admission->id}/notes");

        $response->assertOk()
            ->assertJsonCount(2, 'data');
    }
}
