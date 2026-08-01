# HMS API Reference

> **How to use this file:** Before building any React form or data-fetching component, find the matching section below and copy the exact field names, types, and allowed values from the request table. Never guess field names — they will cause a **422 Unprocessable Content** error.

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Patients](#2-patients)
3. [Doctors](#3-doctors)
4. [Appointments](#4-appointments)
5. [OPD — Diagnoses](#5-opd--diagnoses)
6. [OPD — Prescriptions](#6-opd--prescriptions)
7. [OPD — Lab Requests & Results](#7-opd--lab-requests--results)
8. [IPD — Wards & Beds](#8-ipd--wards--beds)
9. [IPD — Admissions & Nursing Notes](#9-ipd--admissions--nursing-notes)
10. [Billing & Payments](#10-billing--payments)
11. [Pharmacy — Medicines & Dispensing](#11-pharmacy--medicines--dispensing)
12. [Admin & Analytics](#12-admin--analytics)
13. [Common Response Envelopes](#13-common-response-envelopes)

---

## 1. Authentication

| Method | Endpoint              | Role Required | Description         |
|--------|-----------------------|---------------|---------------------|
| POST   | `/api/auth/login`     | Public        | Login               |
| POST   | `/api/auth/logout`    | Authenticated | Logout              |
| GET    | `/api/auth/me`        | Authenticated | Get current user    |

### POST `/api/auth/login`
```json
{
  "email": "string | required",
  "password": "string | required"
}
```
**Response:** `{ token, user: { id, name, email, role } }`

---

## 2. Patients

| Method | Endpoint                       | Role Required              | Description              |
|--------|--------------------------------|----------------------------|--------------------------|
| GET    | `/api/patients`                | admin, doctor, receptionist| List all patients        |
| POST   | `/api/patients`                | admin, receptionist        | Create a patient         |
| GET    | `/api/patients/{id}`           | admin, doctor, patient     | Get single patient       |
| PATCH  | `/api/patients/{id}`           | admin, receptionist        | Update patient           |
| GET    | `/api/patients/{id}/history`   | admin, doctor              | Medical history          |
| GET    | `/api/patients/{id}/prescriptions` | admin, doctor, patient | Patient prescriptions |
| GET    | `/api/patients/{id}/lab-results`   | admin, doctor, patient | Lab results           |
| GET    | `/api/patients/{id}/bills`         | admin, patient         | Bills                 |

> {id} must be an integer. Non-numeric slugs return 404.

### POST `/api/patients` — Create Patient

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | YES | max:255 |
| `email` | string (email) | YES | unique in users table |
| `password` | string | NO | min:8, defaults to `password123` if omitted |
| `dob` | date string | YES | `YYYY-MM-DD`, must be before today |
| `gender` | string | YES | `male` / `female` / `other` |
| `blood_type` | string | YES | `A+` `A-` `B+` `B-` `AB+` `AB-` `O+` `O-` |
| `allergies` | array | NO | See nested fields below |
| `allergies[].allergen` | string | YES if allergies present | max:255 |
| `allergies[].severity` | string | YES if allergies present | `low` / `medium` / `high` |
| `allergies[].notes` | string | NO | max:1000 |
| `emergency_contacts` | array | NO | See nested fields below |
| `emergency_contacts[].name` | string | YES if array present | max:255 |
| `emergency_contacts[].relationship` | string | YES if array present | max:255 |
| `emergency_contacts[].phone` | string | YES if array present | max:255 |

**Example payload:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secret123",
  "dob": "1990-05-15",
  "gender": "male",
  "blood_type": "O+",
  "emergency_contacts": [
    { "name": "Jane Doe", "relationship": "Spouse", "phone": "01700000000" }
  ]
}
```

### PATCH `/api/patients/{id}` — Update Patient

All fields are `sometimes|required` (only send what you want to change). Same field names as POST. Password is always optional.

### GET `/api/patients/{id}` — Response Shape
```json
{
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "dob": "1990-05-15",
    "gender": "male",
    "blood_type": "O+",
    "allergies": [{ "id": 1, "allergen": "Penicillin", "severity": "high", "notes": null }],
    "emergency_contacts": [{ "id": 1, "name": "Jane", "relationship": "Spouse", "phone": "017..." }],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

## 3. Doctors

| Method | Endpoint                    | Role Required      | Description           |
|--------|-----------------------------|--------------------|-----------------------|
| GET    | `/api/doctors`              | Authenticated      | List all doctors      |
| POST   | `/api/doctors`              | admin              | Create a doctor       |
| GET    | `/api/doctors/{id}`         | Authenticated      | Get doctor details    |
| GET    | `/api/doctors/{id}/slots`   | Authenticated      | Available time slots  |
| PATCH  | `/api/doctors/{id}/schedule`| admin, doctor      | Update weekly schedule|

### POST `/api/doctors` — Create Doctor

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | YES | max:255 |
| `email` | string (email) | YES | unique in users table |
| `password` | string | NO | min:8 |
| `specialization` | string | YES | max:255, e.g. `Cardiology` |
| `qualification` | string | YES | max:255, e.g. `MBBS, MD` |
| `fee` | numeric | YES | min:0, in BDT |

### PATCH `/api/doctors/{id}/schedule` — Update Weekly Schedule

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `schedules` | array | YES | One entry per working day |
| `schedules[].day_of_week` | integer | YES | 0=Sunday, 1=Monday ... 6=Saturday |
| `schedules[].is_active` | boolean | NO | Defaults true |
| `schedules[].slots` | array | NO | Time slots for that day |
| `schedules[].slots[].id` | integer | NO | If updating an existing slot |
| `schedules[].slots[].start_time` | string | YES (if new slot) | `HH:MM:SS` format |
| `schedules[].slots[].end_time` | string | YES (if new slot) | `HH:MM:SS` format |
| `schedules[].slots[].is_blocked` | boolean | NO | Block slot from booking |

### GET `/api/doctors/{id}/slots` — Response
```json
{
  "data": [
    {
      "id": 1, "day_of_week": 1, "is_active": true,
      "slots": [
        { "id": 10, "start_time": "09:00:00", "end_time": "09:30:00", "is_blocked": false }
      ]
    }
  ]
}
```

---

## 4. Appointments

| Method | Endpoint                          | Role Required                   | Description          |
|--------|-----------------------------------|---------------------------------|----------------------|
| GET    | `/api/appointments`               | admin, doctor, receptionist     | List appointments    |
| POST   | `/api/appointments`               | admin, patient, receptionist    | Book appointment     |
| GET    | `/api/appointments/{id}`          | Authenticated                   | Get single           |
| PATCH  | `/api/appointments/{id}/status`   | admin, doctor, receptionist     | Update status        |
| DELETE | `/api/appointments/{id}`          | admin, patient                  | Cancel/delete        |

### POST `/api/appointments` — Book Appointment

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `patient_id` | integer | YES | must exist in `patients` table |
| `doctor_id` | integer | YES | must exist in `doctors` table |
| `slot_id` | integer | YES | must exist in `time_slots` table |
| `date` | date string | YES | `YYYY-MM-DD`, today or future |
| `notes` | string | NO | max:1000 |

### PATCH `/api/appointments/{id}/status` — Update Status

| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| `status` | string | YES | `pending` `confirmed` `in_progress` `completed` `cancelled` |

### GET `/api/appointments` — Response Shape
```json
{
  "data": [
    {
      "id": 1, "date": "2024-07-15", "status": "confirmed", "notes": null,
      "patient": { "id": 1, "name": "John Doe" },
      "doctor": { "id": 2, "name": "Dr. Smith", "specialization": "Cardiology" },
      "slot": { "id": 10, "start_time": "09:00:00", "end_time": "09:30:00" },
      "diagnosis": null, "prescription": null, "bill": null
    }
  ]
}
```

---

## 5. OPD — Diagnoses

| Method | Endpoint         | Role Required | Description        |
|--------|------------------|---------------|--------------------|
| POST   | `/api/diagnoses` | doctor        | Record a diagnosis |

### POST `/api/diagnoses`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `appointment_id` | integer | YES | must exist in `appointments` |
| `description` | string | YES | max:1000 |
| `icd_code` | string | NO | ICD-10 code, max:20 |
| `notes` | string | NO | max:2000 |
| `diagnosed_at` | date | NO | defaults to now |

---

## 6. OPD — Prescriptions

| Method | Endpoint                   | Role Required                                | Description         |
|--------|----------------------------|----------------------------------------------|---------------------|
| POST   | `/api/prescriptions`       | doctor                                       | Create prescription |
| GET    | `/api/prescriptions/{id}`  | admin, doctor, patient, nurse, receptionist  | View prescription   |

### POST `/api/prescriptions`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `appointment_id` | integer | YES | must exist in `appointments` |
| `notes` | string | NO | max:2000 |
| `items` | array | YES | min 1 item |
| `items[].medicine_id` | integer | YES | must exist in `medicines` |
| `items[].dosage` | string | YES | e.g. `500mg`, max:100 |
| `items[].frequency` | string | YES | e.g. `Twice daily`, max:100 |
| `items[].duration` | string | YES | e.g. `7 days`, max:100 |

**Example payload:**
```json
{
  "appointment_id": 5,
  "notes": "Take with food",
  "items": [
    { "medicine_id": 3, "dosage": "500mg", "frequency": "Twice daily", "duration": "5 days" }
  ]
}
```

---

## 7. OPD — Lab Requests & Results

| Method | Endpoint                          | Role Required          | Description            |
|--------|-----------------------------------|------------------------|------------------------|
| POST   | `/api/lab-requests`               | doctor                 | Order a lab test       |
| GET    | `/api/lab-tests`                  | admin, doctor          | List available tests   |
| PATCH  | `/api/lab-results/{id}`           | admin, nurse           | Upload result          |
| GET    | `/api/lab-results/{id}`           | admin, doctor, patient | View result            |
| GET    | `/api/lab-results/{id}/download`  | Signed URL             | Download result PDF    |

### POST `/api/lab-requests` — Order Lab Test

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `appointment_id` | integer | YES | must exist in `appointments` |
| `test_id` | integer | YES | must exist in `lab_tests` |

### PATCH `/api/lab-results/{id}` — Upload Result (multipart/form-data)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `result_file` | file | NO | `pdf`, `jpg`, `jpeg`, `png`; max 10MB |
| `notes` | string | NO | max:2000 |
| `is_abnormal` | boolean | NO | true / false |
| `result_at` | date | NO | Date of result |

> FILE UPLOAD: Use `multipart/form-data` (not JSON). Use `FormData` in JavaScript. Set `Content-Type` automatically by passing FormData to axios.

---

## 8. IPD — Wards & Beds

| Method | Endpoint                  | Role Required          | Description          |
|--------|---------------------------|------------------------|----------------------|
| GET    | `/api/wards`              | admin, doctor, nurse   | List all wards       |
| GET    | `/api/wards/{id}/beds`    | admin, nurse           | Beds in a ward       |

### GET `/api/wards` — Response Shape
```json
{
  "data": [
    { "id": 1, "name": "General Ward", "type": "general", "capacity": 20,
      "beds": [{ "id": 1, "bed_number": "A-01", "is_occupied": false }] }
  ]
}
```

### GET `/api/wards/{id}/beds` — Response Shape
```json
{
  "data": [
    {
      "id": 1, "bed_number": "A-01", "is_occupied": true,
      "current_admission": {
        "id": 5, "reason": "Fever",
        "patient": { "id": 2, "name": "Alice" }
      }
    }
  ]
}
```

---

## 9. IPD — Admissions & Nursing Notes

| Method | Endpoint                          | Role Required        | Description           |
|--------|-----------------------------------|----------------------|-----------------------|
| POST   | `/api/admissions`                 | admin, doctor        | Admit a patient       |
| PATCH  | `/api/admissions/{id}/discharge`  | admin, doctor        | Discharge patient     |
| POST   | `/api/admissions/{id}/notes`      | admin, nurse         | Add nursing note      |
| GET    | `/api/admissions/{id}/notes`      | admin, doctor, nurse | List nursing notes    |

### POST `/api/admissions` — Admit Patient

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `patient_id` | integer | YES | must exist in `patients` |
| `bed_id` | integer | YES | must exist in `beds` |
| `doctor_id` | integer | YES | must exist in `doctors` |
| `reason` | string | YES | max:500 |
| `notes` | string | NO | max:2000 |
| `admitted_at` | datetime | NO | defaults to now |

### POST `/api/admissions/{id}/notes` — Add Nursing Note

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `note` | string | YES | max:2000 |
| `recorded_at` | date | NO | defaults to now |

---

## 10. Billing & Payments

| Method | Endpoint               | Role Required                    | Description          |
|--------|------------------------|----------------------------------|----------------------|
| POST   | `/api/bills/generate`  | admin, receptionist              | Generate bill        |
| GET    | `/api/bills/{id}`      | admin, patient, receptionist     | View bill            |
| GET    | `/api/bills/{id}/pdf`  | admin, patient, receptionist     | Download PDF         |
| POST   | `/api/payments`        | admin, receptionist              | Record payment       |

### POST `/api/bills/generate` — Generate Bill

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `appointment_id` | integer | YES | must exist in `appointments` |

> Auto-calculates: doctor fee + medicines used + lab tests ordered.

### POST `/api/payments` — Record Payment

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `bill_id` | integer | YES | must exist in `bills` |
| `amount` | numeric | YES | min:0.01 |
| `method` | string | YES | `cash` / `card` / `online` |
| `reference_no` | string | NO | For card/online transactions, max:255 |

### GET `/api/bills/{id}` — Response Shape
```json
{
  "data": {
    "id": 1, "total_amount": 1500.00, "paid_amount": 1000.00, "status": "partial",
    "patient": { "id": 1, "name": "John Doe" },
    "items": [
      { "description": "Consultation Fee", "amount": 500 },
      { "description": "Paracetamol 500mg x10", "amount": 100 }
    ],
    "payments": [
      { "id": 1, "amount": 1000, "method": "cash", "paid_at": "2024-07-01" }
    ]
  }
}
```

---

## 11. Pharmacy — Medicines & Dispensing

| Method | Endpoint                        | Role Required              | Description          |
|--------|---------------------------------|----------------------------|----------------------|
| GET    | `/api/medicines`                | admin, receptionist, nurse | List medicines       |
| POST   | `/api/medicines`                | admin                      | Add new medicine     |
| PATCH  | `/api/medicines/{id}/stock`     | admin, receptionist, nurse | Update stock batch   |
| POST   | `/api/dispensings`              | admin, receptionist, nurse | Dispense prescription|

### POST `/api/medicines` — Add Medicine

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | YES | max:255 |
| `generic_name` | string | NO | max:255 |
| `unit` | string | YES | e.g. `mg`, `ml`, `tablet` |
| `price` | numeric | YES | min:0, per unit price |
| `stock_threshold` | integer | YES | Low-stock alert level, min:0 |

### PATCH `/api/medicines/{id}/stock` — Restock Medicine

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `batch_no` | string | YES | max:100, batch identifier |
| `quantity` | integer | YES | min:1, units to add |
| `expiry_date` | date | YES | Must be after today (`YYYY-MM-DD`) |

### POST `/api/dispensings` — Dispense Prescription

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `prescription_id` | integer | YES | must exist in `prescriptions` |
| `notes` | string | NO | max:1000 |

---

## 12. Admin & Analytics

All endpoints in this section require `role: admin`.

| Method | Endpoint                             | Description                       |
|--------|--------------------------------------|-----------------------------------|
| GET    | `/api/admin/stats`                   | KPI dashboard figures             |
| GET    | `/api/admin/appointments/trend`      | Appointment counts over time      |
| GET    | `/api/admin/revenue/trend`           | Revenue over time                 |
| GET    | `/api/admin/bed-occupancy`           | Ward bed usage summary            |
| GET    | `/api/admin/activity-log`            | Recent system activity            |
| GET    | `/api/admin/users`                   | All system users                  |
| POST   | `/api/admin/users`                   | Create any user                   |
| PATCH  | `/api/admin/users/{id}/role`         | Change a user's role              |

### POST `/api/admin/users` — Create User

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | string | YES | |
| `email` | string | YES | unique |
| `password` | string | YES | min:8 |
| `role` | string | YES | `admin` `doctor` `patient` `nurse` `receptionist` |

### PATCH `/api/admin/users/{id}/role`

| Field | Type | Required | Allowed Values |
|-------|------|----------|----------------|
| `role` | string | YES | `admin` `doctor` `patient` `nurse` `receptionist` |

---

## 13. Common Response Envelopes

### Success (single resource)
```json
{ "data": { ...resource } }
```

### Success (collection)
```json
{ "data": [ ...resources ] }
```

### Validation Error (422)
```json
{
  "message": "The given data was invalid.",
  "errors": { "field_name": ["Error message for this field."] }
}
```

### Auth Error (401 / 403)
```json
{ "message": "Unauthenticated." }
{ "message": "Forbidden." }
```

---

## Quick Reference — Field Name Cheatsheet

| React State Variable | Correct API Field | Common Wrong Names |
|----------------------|-------------------|--------------------|
| `dob` | `dob` | ~~`date_of_birth`~~ |
| `bloodType` | `blood_type` | ~~`blood`~~ |
| Emergency contacts | `emergency_contacts[].name`, `.relationship`, `.phone` | ~~`emergency_contact_name`~~ (flat) |
| `slotId` | `slot_id` | ~~`time_slot_id`~~ |
| `testId` | `test_id` | ~~`lab_test_id`~~ |
| `batchNo` | `batch_no` | ~~`batch_number`~~ |
| `expiryDate` | `expiry_date` | ~~`expiry`~~ |
| `stockThreshold` | `stock_threshold` | ~~`threshold`~~ |
| `isAbnormal` | `is_abnormal` | ~~`abnormal`~~ |
| `resultAt` | `result_at` | ~~`result_date`~~ |
| `admittedAt` | `admitted_at` | ~~`admission_date`~~ |
| `recordedAt` | `recorded_at` | ~~`date`~~ |
| `referenceNo` | `reference_no` | ~~`ref`~~, ~~`transaction_id`~~ |
| `dayOfWeek` | `day_of_week` | ~~`day`~~ |
| `isActive` | `is_active` | ~~`active`~~ |
| `isBlocked` | `is_blocked` | ~~`blocked`~~ |
| Schedule start/end | `start_time`, `end_time` | Format MUST be `HH:MM:SS` |
| Lab result upload | Use `FormData` | NOT JSON body |
