# 🏥 Hospital Management System (HMS) — Comprehensive Project Summary

This document provides a complete, structured summary of everything implemented in the **Hospital Management System (HMS)** monorepo from **Day 1 through Day 35**. 

---

## 🏗️ Monorepo Stack & Architecture

- **Backend**: Laravel 12.x REST API (selected due to local PHP 8.2 compatibility)
- **Frontend**: React 18 Single Page Application (SPA) driven by Vite 7.x
- **Styling**: Tailwind CSS & Vanilla CSS (providing a clean, professional, custom dark-mode-ready design system)
- **Database**: MySQL (MariaDB 10.4.32 via local XAMPP)
- **Package Management & Workspaces**:
  - **Composer**: Path repositories registered for shared local PHP packages
  - **NPM**: Workspaces registered for shared frontend libraries

---

## 📁 Monorepo Layout & Custom Packages

| Package | Path | Type | Responsibility |
| :--- | :--- | :--- | :--- |
| **Root Application** | `hms/` | Laravel + React | Main entry point, API controllers, React routing/views |
| **`hms/core`** | `hms/packages/hms-core/` | PHP Package | Shared domain enums (e.g. `AppointmentStatus`, `BillStatus`) |
| **`hms/notifications`** | `hms/packages/hms-notifications/` | PHP Package | Shared notifications channels (e.g. SMS, Email templates) |
| **`@hms/ui`** | `hms/packages/hms-ui/` | React/JS Package | Shared React components (e.g. `StatusBadge`, `PatientCodeChip`) |

---

## 🗄️ Database Schema & Migrations (Days 1–7)

The database consists of **25 interconnected tables** across 9 domains:

### 1. Authentication & Roles
- `users`: Core login credentials + soft deletes.
- `roles`, `model_has_roles`: Spatie role/permission mappings.
- `personal_access_tokens`: Sanctum API stateful token management.

### 2. Patient Domain
- `patients`: Linked to `users` with unique auto-generated `patient_code`, `dob`, `gender`, `blood_type`.
- `allergies`: Tracks severity ratings and notes linked to patients.
- `emergency_contacts`: Emergency contact lookup directory.

### 3. Doctor & Schedule Domain
- `doctors`: Linked to `users` with specialization, qualifications, and consultation fees.
- `doctor_schedules`: Weekly recurring grids (days 0–6) for doctor availability.
- `time_slots`: Divides doctor schedules into booked/available slots.

### 4. Appointments
- `appointments`: Connects patients, doctors, and slots with status enums.
- `appointment_logs`: Comprehensive audit trail for appointment status transitions.

### 5. Outpatient (OPD)
- `diagnoses`: Consultation outcomes storing ICD codes and remarks.
- `prescriptions` & `prescription_items`: Medicine items prescribed during a consultation.

### 6. Inpatient (IPD)
- `wards`: Defines ward types (general, ICU, private), capacity, and daily rates.
- `beds`: Ward beds tracked with status (available, occupied, maintenance).
- `admissions`: Tracks patient bed placement and admit/discharge timestamps.
- `nursing_notes`: Chronological record of patient status updates by nurses.

### 7. Laboratory
- `lab_tests`: Catalog of available test codes, names, and turnaround hours.
- `lab_requests`: Doctor orders requesting tests.
- `lab_results`: Technician uploads containing raw results, abnormal flags, and secure download links.

### 8. Pharmacy
- `medicines`: Base medicine inventory with stock thresholds.
- `medicine_batches`: Tracks expiry dates and batch numbers for FIFO deduction.
- `dispensings`: Pharmacist fulfillment logs linked to prescriptions.

### 9. Billing
- `bills`: Aggregated invoice records detailing patient, totals, paid amount, due date, and payment status.
- `bill_items`: Itemized lines (consultation fee, lab tests, bed rates, medicines).
- `payments`: Financial logs tracking cash, card, and online transactions.

---

## ⚙️ Backend Logic & Core Services (Days 8–21)

All major business flows are encapsulated in dedicated service classes to keep controllers thin:

### Key Service Classes
- **`AppointmentService`**: Books appointments, checks slot availability, and verifies role authorization before state transitions.
- **`BillingService`**: Aggregates all expenses (OPD fee + lab requests + bed days × ward rate + dispensed medicine costs) into a single invoice.
- **`DoctorService`**: Manages schedule grids and dynamically generates available time slots.
- **`IpdService`**: Manages patient admissions, updates bed status to occupied/available, and discharges patients.
- **`PatientService`**: Generates unique alphanumeric patient codes and handles profile CRUD.
- **`PharmacyService`**: Processes FIFO batch deductions by expiry date and triggers stock threshold alerts.

### Security, Broadcasting & Observers
- **Laravel Policies**: Finely tuned access control via `AppointmentPolicy`, `BillPolicy`, and `LabResultPolicy` to ensure patients can only access their own records while staff see global dashboards.
- **`AppointmentObserver`**: Automatically logs every status modification to `appointment_logs`.
- **Realtime Channels (`routes/channels.php`)**: Secure Pusher/Echo channels for real-time staff/patient notification alerts.
- **API Hardening**: Implemented rate limiting on auth routes (5 attempts per minute max) and eager loading (`with()`) on all controllers to prevent N+1 queries.

---

## 🎨 React Frontend Foundation (Days 22–28)

A modern, highly responsive frontend architecture built with **React Query**, **Zustand**, and **React Hook Form**:

### State Stores (`zustand`)
- **`authStore.js`**: Managed persistent user sessions and roles.
- **`notificationStore.js`**: Handles real-time system alerts and unread indicators.

### Component System
- **Layouts**:
  - `Layout.jsx`: Responsive drawer Sidebar navigation + top global Header.
  - `TopBar.jsx`: Bell notification panel + user profile settings dropdown.
- **Shared UI Core (`resources/js/components/ui/`)**:
  - `Button`, `Input`, `Badge`, `Modal`, `Table`, `Pagination`, `Toast`, `Skeleton`, `EmptyState`, `ConfirmDialog`.
- **Shared Package `@hms/ui`**:
  - `StatusBadge.jsx`: Dynamic status pills matching domain states.
  - `PatientCodeChip.jsx`: A styled badge for displaying patient IDs.

---

## 💻 Feature Pages & Modules (Days 29–35)

### 👥 Patient Module
- **`PatientList.jsx`**: Global registry searching, sorting, and pagination.
- **`PatientDetail.jsx`**: Rich tab interface containing:
  - Profile (demographics, allergies, emergency contacts)
  - Appointment history
  - Prescriptions dispensed
  - Invoices & payment logs

### 📅 Appointment & Booking
- **`BookAppointment.jsx`**: Multi-step wizard allowing patients to select doctors, pick available dates/time-slots, and confirm bookings.
- **`AppointmentList.jsx`**: Global and user-specific list displaying appointment grids.

### 🩺 Doctor Outpatient (OPD)
- **`ConsultationView.jsx`**: Side-by-side diagnosis logger, prescription builder, and lab order dropdown.
- **`DoctorSchedule.jsx`**: Weekly scheduler where doctors can block/allow specific time slots.

### 🏥 Inpatient (IPD)
- **`WardMap.jsx`**: Visual map displaying all wards and bed availability. Occupied beds are color-coded and clicking them opens patient detail cards.
- **`AdmissionForm.jsx`**: Easy interface to admit patients to empty beds.
- **`NursingNotes.jsx`**: Nurse activity logger for hospitalized patients.

### 🔬 Laboratory Module
- **`LabQueue.jsx`**: Active requests pending collection or report updates.
- **`UploadResult.jsx`**: File drag-and-drop form with normal/abnormal toggle markers.
- **`ResultViewer.jsx`**: In-app PDF previewer and secure file download launcher.

### 💊 Pharmacy Module
- **`Inventory.jsx`**: Inventory listing showing current quantities, low stock warning indicators, and batch additions.

### 💵 Billing Module
- **`BillDetail.jsx`**: Interactive receipt displaying aggregated items, amount paid, and payment recording form.
- **`BillList.jsx`**: Financial invoice directory for receptionist audit.

---

## 🧪 Verification & Test Results

The backend features a comprehensive test suite of **92 tests** (encompassing unit and feature endpoints) executing with a **100% pass rate**:

- **Auth Coverage**: Register, Login (throttled), revoke tokens, role authorization (403 blocks).
- **OPD Flow Coverage**: Doctors recording diagnoses, prescribing items, ordering labs.
- **IPD Flow Coverage**: Strict bed assignments preventing double bookings, bed status transitions, and nursing note order.
- **Billing Flow Coverage**: Validating exact mathematical fee aggregations and PDF streaming integrity.
- **Pharmacy Coverage**: Verifying FIFO inventory batch deductions and stock alert dispatches.

---
*HMS V1 Project Summary · Compiled: July 9, 2026*
