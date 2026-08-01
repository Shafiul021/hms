<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     *
     * Execution order respects foreign-key dependencies:
     *
     *  Phase 0 — Roles, Auth & Master Catalogs (no dependencies)
     *  Phase 1 — Doctor staff + user accounts
     *  Phase 2 — Scheduling (depends on doctors)
     *  Phase 3 — Patients + related records
     *  Phase 4 — Appointments (depends on patients, doctors, slots)
     *  Phase 5 — Clinical records (depends on appointments)
     *  Phase 6 — Inpatient / Ward (depends on patients, beds)
     *  Phase 7 — Laboratory (depends on appointments, lab_tests)
     *  Phase 8 — Pharmacy / Inventory (depends on medicines, prescriptions)
     *  Phase 9 — Billing & Payments (depends on appointments, patients)
     */
    public function run(): void
    {
        $this->call([
            // ── Phase 0 ────────────────────────────────────────────────────
            RolePermissionSeeder::class,   // roles, permissions
            AdminUserSeeder::class,        // users (admin)
            LabTestSeeder::class,          // lab_tests
            WardBedSeeder::class,          // wards, beds
            MedicineSeeder::class,         // medicines

            // ── Phase 1 ────────────────────────────────────────────────────
            DoctorSeeder::class,           // users (doctors), doctors

            // ── Phase 2 ────────────────────────────────────────────────────
            DoctorScheduleSeeder::class,   // doctor_schedules
            TimeSlotSeeder::class,         // time_slots

            // ── Phase 3 ────────────────────────────────────────────────────
            PatientSeeder::class,          // users (patients), patients
            AllergySeeder::class,          // allergies
            EmergencyContactSeeder::class, // emergency_contacts

            // ── Phase 4 ────────────────────────────────────────────────────
            AppointmentSeeder::class,      // appointments
            AppointmentLogSeeder::class,   // appointment_logs

            // ── Phase 5 ────────────────────────────────────────────────────
            DiagnosisSeeder::class,        // diagnoses
            PrescriptionSeeder::class,     // prescriptions
            PrescriptionItemSeeder::class, // prescription_items

            // ── Phase 6 ────────────────────────────────────────────────────
            AdmissionSeeder::class,        // admissions
            NursingNoteSeeder::class,      // nursing_notes

            // ── Phase 7 ────────────────────────────────────────────────────
            LabRequestSeeder::class,       // lab_requests
            LabResultSeeder::class,        // lab_results

            // ── Phase 8 ────────────────────────────────────────────────────
            MedicineBatchSeeder::class,    // medicine_batches
            DispensingSeeder::class,       // dispensings

            // ── Phase 9 ────────────────────────────────────────────────────
            BillSeeder::class,             // bills
            BillItemSeeder::class,         // bill_items
            PaymentSeeder::class,          // payments
        ]);
    }
}

