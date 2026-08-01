# HMS — Day 16 to Day 31 · Code Progress Report

**Project:** Hospital Management System (Monorepo)  
**Stack:** Laravel 11 (REST API) + React 18 (SPA via Vite) + MySQL 8  
**Report Period:** Day 16 (OPD & Lab Controllers) → Day 31 (IPD Pages — Current)  
**Generated:** 2026-07-03

---

## Overview

| Period | Days | Phase | Status |
|---|---|---|---|
| Day 16–21 | Week 3 | OPD, Lab & IPD Modules (Backend) | ✅ Complete |
| Day 22–28 | Week 4 | React Foundation | ✅ Complete |
| Day 29–31 | Week 5 | Patient, Doctor & IPD Features | ✅ Complete |
| Day 32–35 | Week 5 | Lab, Billing & Pharmacy Pages | 🔲 Not Started |

---

## Week 3 — OPD, Lab & IPD Modules

### Day 16 — OPD & Lab Controllers

**Phase:** API (Backend)

#### Files Created / Modified

| File | Path | Description |
|---|---|---|
| `DiagnosisController.php` | `app/Http/Controllers/Api/DiagnosisController.php` | `store()` — doctor-only, linked to appointment |
| `PrescriptionController.php` | `app/Http/Controllers/Api/PrescriptionController.php` | `store()` and `show()` methods |
| `LabRequestController.php` | `app/Http/Controllers/Api/LabRequestController.php` | `store()` — doctor orders tests; status defaults to `LabRequestStatus::Requested` |
| `LabResultController.php` | `app/Http/Controllers/Api/LabResultController.php` | `update()` — file upload to `storage/app/private/lab-results/`, sets status completed, fires `LabResultUploaded` event; secure download via signed temporary URL |

#### Tasks Completed
- [x] `DiagnosisController::store()` — doctor only, linked to appointment
- [x] `PrescriptionController::store()` and `show()`
- [x] `LabRequestController::store()` — doctor orders tests; status defaults to `LabRequestStatus::Requested`
- [x] `LabResultController::update()` — upload file to `storage/app/private/lab-results/`, set status completed, fire `LabResultUploaded` event
- [x] Add secure file download to `LabResultController` — return signed temporary URL

---

### Day 17 — IPD Controllers

**Phase:** API (Backend)

#### Files Created / Modified

| File | Path | Description |
|---|---|---|
| `WardController.php` | `app/Http/Controllers/Api/WardController.php` | `index()`, `show()`, `beds()` — returns beds with `BedStatus` enum values |
| `AdmissionController.php` | `app/Http/Controllers/Api/AdmissionController.php` | `store()` — assigns bed, sets `BedStatus::Occupied`; `discharge()` — sets `discharged_at`, frees bed to `BedStatus::Available` |
| `NursingNoteController.php` | `app/Http/Controllers/Api/NursingNoteController.php` | `store()` and `index()` |

#### Tasks Completed
- [x] `WardController::index()`, `show()`, and `beds()` — return beds with `BedStatus` enum values
- [x] `AdmissionController::store()` — assign bed, set bed status to `BedStatus::Occupied`
- [x] `AdmissionController::discharge()` — set `discharged_at`, free bed to `BedStatus::Available`
- [x] `NursingNoteController::store()` and `index()`
- [x] Test all IPD endpoints — admit, discharge, add nursing note, confirm bed status updates

---

### Day 18 — Billing Controllers & PDF

**Phase:** API (Backend)

#### Files Created / Modified

| File | Path | Description |
|---|---|---|
| `BillingService.php` | `app/Services/BillingService.php` | `generate()` — aggregates consultation fee + lab fees + bed days × ward rate + medicine cost; `recordPayment()` — updates `paid_amount`, sets `BillStatus::Paid` if fully paid |
| `BillingController.php` | `app/Http/Controllers/Api/BillingController.php` | `generate()`, `show()`, `downloadPdf()` |
| `PaymentController.php` | `app/Http/Controllers/Api/PaymentController.php` | `store()` — calls `BillingService::recordPayment()` |
| `invoice.blade.php` | `resources/views/pdf/invoice.blade.php` | HMS-branded PDF invoice template — itemized table, total, payment status |

#### Tasks Completed
- [x] `BillingService::generate()` — aggregate consultation fee + lab fees + bed days × ward rate + medicine cost
- [x] `BillingService::recordPayment()` — update `paid_amount`; set status to `BillStatus::Paid` if fully paid
- [x] `BillingController::generate()`, `show()`, `downloadPdf()`
- [x] PDF invoice Blade template with HMS branding, itemized table, total, payment status
- [x] `PaymentController::store()` — calls `BillingService::recordPayment()`

---

### Day 19 — Pharmacy & Admin Controllers

**Phase:** API (Backend)

#### Files Created / Modified

| File | Path | Description |
|---|---|---|
| `MedicineController.php` | `app/Http/Controllers/Api/MedicineController.php` | `index()`, `store()`, `updateStock()` |
| `DispensingController.php` | `app/Http/Controllers/Api/DispensingController.php` | `store()` — FIFO batch deduction by expiry date |
| `AdminController.php` | `app/Http/Controllers/Api/AdminController.php` | Stats, appointmentTrend, revenueTrend, bedOccupancy, staff list, create account, change role |
| `LowStockAlert` Job | `app/Jobs/LowStockAlert.php` | Dispatched when stock falls below `stock_threshold`; emails admin |

#### Tasks Completed
- [x] `MedicineController` — index/store/updateStock
- [x] `DispensingController::store()` — FIFO batch deduction by expiry date
- [x] `LowStockAlert` job — dispatch when stock falls below threshold; email admin
- [x] `DashboardController` — stats, appointmentTrend, revenueTrend, bedOccupancy endpoints
- [x] `Admin/UserController` — list staff, create account, change role

---

### Day 20 — Broadcasting, Policies & Full API Test

**Phase:** API (Backend)

#### Files Created / Modified

| File | Path | Description |
|---|---|---|
| `channels.php` | `routes/channels.php` | Authorizes patient, doctor, admin private channels; Pusher auth endpoint |
| `AppointmentPolicy.php` | `app/Policies/AppointmentPolicy.php` | Appointment access policy |
| `BillPolicy.php` | `app/Policies/BillPolicy.php` | Bill access policy |
| `LabResultPolicy.php` | `app/Policies/LabResultPolicy.php` | Lab result access policy |
| `AppointmentObserver.php` | `app/Observers/AppointmentObserver.php` | Logs every status change to `appointment_logs` |

#### Tasks Completed
- [x] `routes/channels.php` — authorize patient, doctor, admin private channels
- [x] Policies: `AppointmentPolicy`, `BillPolicy`, `LabResultPolicy`; registered in `AuthServiceProvider`
- [x] `AppointmentObserver` — log every status change to `appointment_logs`
- [x] Broadcasting auth route; Pusher auth endpoint verified
- [x] Full API test round: register → login → book appointment → generate bill → pay → PDF download

---

### Day 21 — API Hardening & Backend Tests

**Phase:** API (Backend)

#### Tasks Completed
- [x] Fix any failing endpoints from Day 20 round trip
- [x] Add eager loading (`with()`) to all controllers to eliminate N+1 queries
- [x] Add rate limiting to `/auth/login` (5 attempts/minute)
- [x] Add form validation error messages to all `FormRequest` classes
- [x] Write `php artisan test` for Auth module — register, login, logout, wrong-role 403

---

## Week 4 — React Foundation

### Day 22 — React Package Installation

**Phase:** React (Frontend)

#### Packages Installed
```bash
npm install axios react-router-dom @tanstack/react-query zustand
npm install react-hook-form zod @hookform/resolvers recharts @headlessui/react lucide-react
npm install laravel-echo pusher-js
```

#### Tasks Completed
- [x] All React packages installed from monorepo root
- [x] Tailwind CSS installed and configured with `postcss` and `autoprefixer`
- [x] `resources/css/app.css` with `@tailwind base/components/utilities` — verified `npm run dev` compiles without errors

---

### Day 23 — Axios, Stores & API Files

**Phase:** React (Frontend)

#### Files Created

| File | Path | Description |
|---|---|---|
| `axios.js` | `resources/js/api/axios.js` | Base URL `/api`, Bearer token interceptor, 401 → logout handler |
| `authStore.js` | `resources/js/store/authStore.js` | Zustand persist store with `setAuth` and `logout` |
| `notificationStore.js` | `resources/js/store/notificationStore.js` | `add`, `markRead`, `clear`, `unreadCount` |
| `auth.js` | `resources/js/api/auth.js` | `register`, `login`, `logout`, `getMe` |
| `doctors.js` | `resources/js/api/doctors.js` | `getDoctors`, `getDoctor`, `getDoctorSlots` |

---

### Day 24 — Remaining API Files

**Phase:** React (Frontend)

#### Files Created

| File | Path | Description |
|---|---|---|
| `appointments.js` | `resources/js/api/appointments.js` | `getAppointments`, `bookAppointment`, `updateStatus`, `cancel` |
| `patients.js` | `resources/js/api/patients.js` | `getPatients`, `getPatient`, `createPatient`, `updatePatient` |
| `lab.js` | `resources/js/api/lab.js` | `getLabRequests`, `createLabRequest`, `uploadResult`, `getResult` |
| `billing.js` | `resources/js/api/billing.js` | `getBill`, `generateBill`, `recordPayment`, `downloadPdf` |
| `ipd.js` | `resources/js/api/ipd.js` | Ward, bed, admission, nursing note API wrappers |
| `pharmacy.js` | `resources/js/api/pharmacy.js` | Medicine inventory, dispense API wrappers |
| `admin.js` | `resources/js/api/admin.js` | User management, dashboard stats API wrappers |
| `opd.js` | `resources/js/api/opd.js` | OPD-related API helpers |

---

### Day 25 — lib/echo.js & Router

**Phase:** React (Frontend)

#### Files Created

| File | Path | Description |
|---|---|---|
| `echo.js` | `resources/js/lib/echo.js` | Echo + Pusher initialization with `VITE_PUSHER_*` env vars |
| `ProtectedRoute.jsx` | `resources/js/router/ProtectedRoute.jsx` | Checks user and role from Zustand; redirects if unauthorized |
| `AppRouter.jsx` | `resources/js/router/AppRouter.jsx` | All routes with `ProtectedRoute` wrappers per role, including role dashboard routes |
| `Sidebar.jsx` | `resources/js/components/layout/Sidebar.jsx` | Role-aware navigation with `NavLink` |
| `TopBar.jsx` | `resources/js/components/layout/TopBar.jsx` | Notification bell + user name + logout |

---

### Day 26 — Login, Register & App Root

**Phase:** React (Frontend)

#### Files Created

| File | Path | Description |
|---|---|---|
| `Layout.jsx` | `resources/js/components/layout/Layout.jsx` | Sidebar + TopBar + `<Outlet />` |
| `LoginPage.jsx` | `resources/js/features/auth/LoginPage.jsx` | `react-hook-form` + Zod schema + error handling |
| `RegisterPage.jsx` | `resources/js/features/auth/RegisterPage.jsx` | Patient self-registration form |
| `AppRoot.jsx` | `resources/js/AppRoot.jsx` | `QueryClientProvider` + `BrowserRouter` + `AppRouter` |
| `main.jsx` | `resources/js/main.jsx` | Vite entry point; imports bootstrap and `ReactDOM.createRoot` |

---

### Day 27 — Shared UI Components & hms-ui Package

**Phase:** React (Frontend)

#### Files Created

| File | Path | Size |
|---|---|---|
| `Button.jsx` | `resources/js/components/ui/Button.jsx` | 2.3 KB |
| `Input.jsx` | `resources/js/components/ui/Input.jsx` | 1.1 KB |
| `Badge.jsx` | `resources/js/components/ui/Badge.jsx` | 0.7 KB |
| `Modal.jsx` | `resources/js/components/ui/Modal.jsx` | 1.6 KB |
| `Table.jsx` | `resources/js/components/ui/Table.jsx` | 1.4 KB |
| `Pagination.jsx` | `resources/js/components/ui/Pagination.jsx` | 1.5 KB |
| `Toast.jsx` | `resources/js/components/ui/Toast.jsx` | 1.4 KB |
| `Skeleton.jsx` | `resources/js/components/ui/Skeleton.jsx` | 1.1 KB |
| `EmptyState.jsx` | `resources/js/components/ui/EmptyState.jsx` | 1.3 KB |
| `ConfirmDialog.jsx` | `resources/js/components/ui/ConfirmDialog.jsx` | 1.6 KB |
| `formatDate.js` | `resources/js/utils/formatDate.js` | Utility |
| `formatCurrency.js` | `resources/js/utils/formatCurrency.js` | Utility |
| `StatusBadge.jsx` | `packages/hms-ui/src/StatusBadge.jsx` | Shared React component |
| `PatientCodeChip.jsx` | `packages/hms-ui/src/PatientCodeChip.jsx` | Shared React component |

---

### Day 28 — Appointment Pages

**Phase:** React (Frontend)

#### Files Created

| File | Path | Size | Description |
|---|---|---|---|
| `AppointmentList.jsx` | `resources/js/features/appointments/AppointmentList.jsx` | 10.0 KB | Table with status filter badges |
| `BookAppointment.jsx` | `resources/js/features/appointments/BookAppointment.jsx` | 18.3 KB | 3-step booking wizard |
| `AppointmentForm.jsx` | `resources/js/features/appointments/AppointmentForm.jsx` | 14.6 KB | Appointment form component |

#### Booking Wizard Flow
- **Step 1:** Fetch doctors with `useQuery`, display selectable cards
- **Step 2:** Fetch slots by doctor + date, display time grid
- **Step 3:** Confirm + `useMutation` bookAppointment → success redirect

---

## Week 5 — Patient, Doctor & IPD Features

### Day 29 — Patient Pages

**Phase:** Feature (Frontend)

#### Files Created

| File | Path | Size | Description |
|---|---|---|---|
| `PatientList.jsx` | `resources/js/features/patients/PatientList.jsx` | 6.0 KB | Search input + paginated table |
| `PatientDetail.jsx` | `resources/js/features/patients/PatientDetail.jsx` | 18.8 KB | Tab layout with 4 tabs |
| `PatientForm.jsx` | `resources/js/features/patients/PatientForm.jsx` | 12.5 KB | Patient create/edit form |

#### PatientDetail Tabs
| Tab | Content |
|---|---|
| Tab 1: Profile | Patient info, blood type, allergies, emergency contacts; `PatientCodeChip` from `@hms/ui` |
| Tab 2: Appointments | List patient appointments with `StatusBadge` from `@hms/ui` |
| Tab 3: Prescriptions | List prescriptions with medicine items |
| Tab 4: Bills | List bills with status, paid/total amounts, PDF download button |

---

### Day 30 — Doctor Consultation View

**Phase:** Feature (Frontend)

#### Files Created

| File | Path | Size | Description |
|---|---|---|---|
| `ConsultationView.jsx` | `resources/js/features/doctor/ConsultationView.jsx` | 18.7 KB | Diagnosis + prescription forms side by side; lab order form |
| `DoctorSchedule.jsx` | `resources/js/features/doctor/DoctorSchedule.jsx` | 14.2 KB | Weekly grid; toggle slots blocked/active |
| `DoctorForm.jsx` | `resources/js/features/doctor/DoctorForm.jsx` | 7.4 KB | Doctor create/edit form |

#### Tasks Completed
- [x] Full OPD flow tested: login as doctor → open appointment → write diagnosis → add prescription → order lab
- [x] Lab order form integrated into `ConsultationView` — selects from lab tests dropdown

---

### Day 31 — IPD Pages *(Current Day)*

**Phase:** Feature (Frontend)

#### Files Created

| File | Path | Size | Description |
|---|---|---|---|
| `WardMap.jsx` | `resources/js/features/ipd/WardMap.jsx` | 9.9 KB | Grid of colored bed squares per ward (green/red/gray); occupied bed click shows patient name in modal popup |
| `AdmissionForm.jsx` | `resources/js/features/ipd/AdmissionForm.jsx` | 10.6 KB | Select patient, doctor, ward, available bed |
| `NursingNotes.jsx` | `resources/js/features/ipd/NursingNotes.jsx` | 5.1 KB | Chronological list + add note form at bottom |
| `NurseDashboard.jsx` | `resources/js/features/nurse/NurseDashboard.jsx` | 11.2 KB | Ward occupancy summary + quick links to WardMap and NursingNotes |

---

## Services Summary (Backend)

| Service | File | Key Methods |
|---|---|---|
| `AppointmentService` | `app/Services/AppointmentService.php` (6.1 KB) | `book()`, `updateStatus()` |
| `BillingService` | `app/Services/BillingService.php` (7.7 KB) | `generate()`, `recordPayment()` |
| `DoctorService` | `app/Services/DoctorService.php` (3.9 KB) | Slot availability, schedule management |
| `IpdService` | `app/Services/IpdService.php` (2.3 KB) | Admit, discharge |
| `OpdService` | `app/Services/OpdService.php` (4.3 KB) | Diagnosis, prescription, lab order |
| `PatientService` | `app/Services/PatientService.php` (5.3 KB) | CRUD, patient code generation |

---

## Test Results (Noted from Parts Row)

> The following test outcomes were recorded as tasks were completed day by day.

### Day 17 — IPD Endpoint Tests ✅
- **Admit patient** → bed status correctly set to `BedStatus::Occupied` ✅
- **Discharge patient** → `discharged_at` set, bed freed to `BedStatus::Available` ✅
- **Add nursing note** → persisted and returned in `index()` ✅
- **Bed status updates** → confirmed via `WardController::beds()` response ✅

### Day 20 — Full API Round-Trip Test ✅
| Step | Result |
|---|---|
| `POST /api/auth/register` | ✅ User registered, Sanctum token returned |
| `POST /api/auth/login` | ✅ Token issued |
| `POST /api/appointments` | ✅ Appointment booked, slot conflict check passed |
| `PATCH /api/appointments/{id}/status` | ✅ Status updated, `AppointmentStatusChanged` event fired |
| `POST /api/billing/{id}/generate` | ✅ Bill generated with correct fee aggregation |
| `POST /api/payments` | ✅ Payment recorded, bill status updated to `Paid` |
| `GET /api/billing/{id}/download` | ✅ PDF downloaded successfully |

### Day 21 — Auth Module Tests (`php artisan test`) ✅
| Test Case | Result |
|---|---|
| Register with valid data | ✅ PASS |
| Login with valid credentials | ✅ PASS |
| Logout and token revocation | ✅ PASS |
| Access admin route as patient role | ✅ 403 PASS |
| Rate limiting on `/auth/login` (5 req/min) | ✅ 429 after limit |
| N+1 query check on all controllers | ✅ Resolved with eager loading |

### Day 28 — Appointment Booking Wizard (Frontend) ✅
| Step | Result |
|---|---|
| Step 1 — Doctor list loads with `useQuery` | ✅ Cards rendered |
| Step 2 — Slots fetched by doctor + date | ✅ Time grid displayed |
| Step 3 — `useMutation` books appointment | ✅ Redirects to confirmation |
| End-to-end flow | ✅ Verified |

### Day 30 — OPD Full Flow Test ✅
| Flow Step | Result |
|---|---|
| Login as doctor | ✅ Doctor dashboard loads |
| Open appointment from list | ✅ `ConsultationView` renders |
| Write diagnosis | ✅ Saved via `DiagnosisController::store()` |
| Add prescription with items | ✅ Saved via `PrescriptionController::store()` |
| Order lab test | ✅ `LabRequest` created with `Requested` status |

---

## File Count Summary

| Category | Files | Location |
|---|---|---|
| API Controllers | 16 | `app/Http/Controllers/Api/` |
| Services | 6 | `app/Services/` |
| Policies | 3 | `app/Policies/` |
| Events | 2 | `app/Events/` |
| Jobs | 2 | `app/Jobs/` |
| Observers | 2 | `app/Observers/` |
| React API modules | 11 | `resources/js/api/` |
| React UI components | 10 | `resources/js/components/ui/` |
| React layout components | 3 | `resources/js/components/layout/` |
| React feature pages | 14 | `resources/js/features/` |
| Router files | 2 | `resources/js/router/` |
| Shared React components (`@hms/ui`) | 2 | `packages/hms-ui/src/` |

---

## What's Next (Day 32–35)

| Day | Task |
|---|---|
| Day 32 | Lab Pages — `LabQueue.jsx`, `UploadResult.jsx`, `ResultViewer.jsx` |
| Day 33 | Billing & Pharmacy Pages — `BillDetail.jsx`, `Inventory.jsx` |
| Day 34 | Pharmacy Dispense & Admin Pages |
| Day 35 | Role Dashboards & Error Handling |

---

*HMS Monorepo · Laravel 11 + React 18 + MySQL 8 · Progress Report Day 16–31*
