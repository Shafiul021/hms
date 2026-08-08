<?php

use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\PatientController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\AppointmentController;
use App\Http\Controllers\Api\DiagnosisController;
use App\Http\Controllers\Api\PrescriptionController;
use App\Http\Controllers\Api\LabRequestController;
use App\Http\Controllers\Api\LabResultController;
use App\Http\Controllers\Api\WardController;
use App\Http\Controllers\Api\AdmissionController;
use App\Http\Controllers\Api\NursingNoteController;
use App\Http\Controllers\Api\BillingController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\LabTestController;
use App\Http\Controllers\Api\MedicineController;
use App\Http\Controllers\Api\DispensingController;
use App\Http\Controllers\Api\AdminController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// ── Public Auth Endpoints ─────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register'])->name('auth.register');
    Route::post('login',    [AuthController::class, 'login'])
        ->middleware('throttle:5,1')
        ->name('auth.login');
});

// ── Protected Endpoints ───────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {
    
    // Auth Sessions
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('auth.logout');
        Route::get('me',      [AuthController::class, 'me'])->name('auth.me');
        Route::patch('profile', [AuthController::class, 'updateProfile'])->name('auth.profile.update');
        Route::patch('password', [AuthController::class, 'changePassword'])->name('auth.password.update');
    });

    // Patients
    Route::prefix('patients')->group(function () {
        // List — admin, receptionist, doctor, nurse
        Route::get('/', [PatientController::class, 'index'])
            ->middleware('role:admin|receptionist|doctor|nurse')
            ->name('patients.index');
            
        // Create — admin, receptionist
        Route::post('/', [PatientController::class, 'store'])
            ->middleware('role:admin|receptionist')
            ->name('patients.store');
            
        Route::get('{id}', [PatientController::class, 'show'])
            ->middleware('role:admin|doctor|receptionist')
            ->whereNumber('id')
            ->name('patients.show');
            
        Route::patch('{id}', [PatientController::class, 'update'])
            ->middleware('role:admin|receptionist')
            ->whereNumber('id')
            ->name('patients.update');
            
        Route::get('{id}/history', [PatientController::class, 'history'])
            ->middleware('role:admin|doctor')
            ->whereNumber('id')
            ->name('patients.history');
            
        Route::get('{id}/prescriptions', [PatientController::class, 'prescriptions'])
            ->middleware('role:admin|doctor|patient')
            ->whereNumber('id')
            ->name('patients.prescriptions');
            
        Route::get('{id}/lab-results', [PatientController::class, 'labResults'])
            ->middleware('role:admin|doctor|patient')
            ->whereNumber('id')
            ->name('patients.lab-results');
            
        Route::get('{id}/bills', [PatientController::class, 'bills'])
            ->middleware('role:admin|patient')
            ->whereNumber('id')
            ->name('patients.bills');

        Route::delete('{id}', [PatientController::class, 'destroy'])
            ->middleware('role:admin')
            ->whereNumber('id')
            ->name('patients.destroy');

        Route::get('{id}/download-medical-history', [PatientController::class, 'downloadMedicalHistory'])
            ->whereNumber('id')
            ->name('patients.download-medical-history');
    });

    // Doctors
    Route::prefix('doctors')->group(function () {
        Route::get('/', [DoctorController::class, 'index'])->name('doctors.index');
        Route::get('{id}', [DoctorController::class, 'show'])->whereNumber('id')->name('doctors.show');
        Route::get('{id}/slots', [DoctorController::class, 'slots'])->whereNumber('id')->name('doctors.slots');
        
        Route::post('/', [DoctorController::class, 'store'])
            ->middleware('role:admin')
            ->name('doctors.store');

        Route::patch('{id}', [DoctorController::class, 'update'])
            ->middleware('role:admin')
            ->whereNumber('id')
            ->name('doctors.update');
            
        Route::patch('{id}/schedule', [DoctorController::class, 'updateSchedule'])
            ->middleware('role:admin|doctor')
            ->whereNumber('id')
            ->name('doctors.schedule');
    });

    // Appointments
    Route::prefix('appointments')->group(function () {
        // List — all clinical staff + patient (patient sees own only, controller handles scoping)
        Route::get('/', [AppointmentController::class, 'index'])
            ->middleware('role:admin|doctor|receptionist|nurse|patient')
            ->name('appointments.index');

        // Book — admin, receptionist, doctor, patient
        Route::post('/', [AppointmentController::class, 'store'])
            ->middleware('role:admin|patient|receptionist|doctor')
            ->name('appointments.store');

        // Instant Book — admin, receptionist, doctor
        Route::post('instant', [AppointmentController::class, 'instantBook'])
            ->middleware('role:admin|receptionist|doctor')
            ->name('appointments.instant');

        // Single appointment detail — any authenticated user
        Route::get('{id}', [AppointmentController::class, 'show'])->whereNumber('id')->name('appointments.show');

        // PDF Downloads
        Route::get('{id}/download-prescription', [AppointmentController::class, 'downloadPrescription'])->whereNumber('id')->name('appointments.download-prescription');
        Route::get('{id}/download-bill', [AppointmentController::class, 'downloadBill'])->whereNumber('id')->name('appointments.download-bill');

        // Update status — admin, doctor, receptionist, nurse
        Route::patch('{id}/status', [AppointmentController::class, 'updateStatus'])
            ->middleware('role:admin|doctor|receptionist|nurse')
            ->whereNumber('id')
            ->name('appointments.status');

        // Reschedule
        Route::post('{id}/reschedule', [AppointmentController::class, 'reschedule'])
            ->middleware('role:admin|doctor|receptionist')
            ->whereNumber('id')
            ->name('appointments.reschedule');

        // Cancel
        Route::post('{id}/cancel', [AppointmentController::class, 'cancel'])
            ->middleware('role:admin|patient|receptionist|doctor')
            ->whereNumber('id')
            ->name('appointments.cancel');

        // Cancel/delete (legacy hard/soft delete) — admin, patient, receptionist
        Route::delete('{id}', [AppointmentController::class, 'destroy'])
            ->middleware('role:admin|patient|receptionist')
            ->whereNumber('id')
            ->name('appointments.destroy');
    });

    // OPD — Prescriptions & Diagnoses
    Route::post('diagnoses', [DiagnosisController::class, 'store'])
        ->middleware('role:doctor')
        ->name('diagnoses.store');
        
    Route::prefix('symptoms')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\SymptomController::class, 'index'])->name('symptoms.index');
        Route::post('/', [\App\Http\Controllers\Api\SymptomController::class, 'store'])->name('symptoms.store');
    });
        
    Route::prefix('prescriptions')->group(function () {
        Route::get('/', [PrescriptionController::class, 'index'])
            ->middleware('role:admin|doctor|nurse|receptionist')
            ->name('prescriptions.index');
        Route::post('/', [PrescriptionController::class, 'store'])
            ->middleware('role:doctor')
            ->name('prescriptions.store');
        Route::get('{id}', [PrescriptionController::class, 'show'])
            ->middleware('role:admin|doctor|patient|nurse|receptionist')
            ->whereNumber('id')
            ->name('prescriptions.show');
        Route::get('{id}/pdf', [PrescriptionController::class, 'downloadPdf'])
            ->middleware('role:admin|doctor|patient|nurse|receptionist')
            ->whereNumber('id')
            ->name('prescriptions.pdf');
    });
    
    Route::prefix('lab-requests')->group(function () {
        Route::post('/', [LabRequestController::class, 'store'])
            ->middleware('role:doctor')
            ->name('lab-requests.store');
        Route::get('/', [LabRequestController::class, 'index'])
            ->middleware('role:admin|doctor|nurse|patient')
            ->name('lab-requests.index');
        Route::get('{id}', [LabRequestController::class, 'show'])
            ->middleware('role:admin|doctor|nurse|patient')
            ->whereNumber('id')
            ->name('lab-requests.show');
    });
        
    Route::prefix('lab-results')->group(function () {
        Route::patch('{id}', [LabResultController::class, 'update'])
            ->middleware('role:admin|nurse')
            ->whereNumber('id')
            ->name('lab-results.update');
        Route::get('{id}', [LabResultController::class, 'show'])
            ->middleware('role:admin|doctor|patient')
            ->whereNumber('id')
            ->name('lab-results.show');
        Route::get('{id}/download', [LabResultController::class, 'download'])
            ->whereNumber('id')
            ->name('lab-results.download')
            ->middleware('signed');
    });

    // IPD — Wards, Beds, Admissions
    Route::prefix('wards')->group(function () {
        Route::get('/', [WardController::class, 'index'])
            ->middleware('role:admin|doctor|nurse')
            ->name('wards.index');
        Route::get('{id}/beds', [WardController::class, 'beds'])
            ->middleware('role:admin|doctor|nurse')
            ->name('wards.beds');
    });
    
    Route::prefix('admissions')->group(function () {
        Route::post('/', [AdmissionController::class, 'store'])
            ->middleware('role:admin|doctor|nurse')
            ->name('admissions.store');
            
        Route::patch('{id}/discharge', [AdmissionController::class, 'discharge'])
            ->middleware('role:admin|doctor|nurse')
            ->name('admissions.discharge');
            
        Route::post('{id}/notes', [NursingNoteController::class, 'store'])
            ->middleware('role:admin|nurse')
            ->name('admissions.notes.store');
            
        Route::get('{id}/notes', [NursingNoteController::class, 'index'])
            ->middleware('role:admin|doctor|nurse')
            ->name('admissions.notes.index');
    });

    // Billing & Payments
    Route::prefix('bills')->group(function () {
        Route::get('/', [BillingController::class, 'index'])
            ->middleware('role:admin|patient|receptionist')
            ->name('bills.index');

        Route::post('generate', [BillingController::class, 'generate'])
            ->middleware('role:admin|receptionist')
            ->name('bills.generate');
            
        Route::get('{id}', [BillingController::class, 'show'])
            ->middleware('role:admin|patient|receptionist')
            ->name('bills.show');
            
        Route::get('{id}/pdf', [BillingController::class, 'downloadPdf'])
            ->middleware('role:admin|patient|receptionist')
            ->name('bills.pdf');
    });
    
    Route::post('payments', [PaymentController::class, 'store'])
        ->middleware('role:admin|receptionist')
        ->name('payments.store');

    // Lab Tests & Pharmacy
    Route::get('lab-tests', [LabTestController::class, 'index'])
        ->middleware('role:admin|doctor')
        ->name('lab-tests.index');
        
    Route::prefix('medicines')->group(function () {
        Route::get('/', [MedicineController::class, 'index'])
            ->middleware('role:admin|receptionist|nurse|doctor')
            ->name('medicines.index');
            
        Route::post('/', [MedicineController::class, 'store'])
            ->middleware('role:admin')
            ->name('medicines.store');
            
        Route::patch('{id}/stock', [MedicineController::class, 'updateStock'])
            ->middleware('role:admin|receptionist|nurse')
            ->name('medicines.stock');
    });
    
    Route::post('dispensings', [DispensingController::class, 'store'])
        ->middleware('role:admin|receptionist|nurse')
        ->name('dispensings.store');

    // Admin & Analytics
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        Route::get('stats', [AdminController::class, 'stats'])->name('admin.stats');
        Route::get('appointments/trend', [AdminController::class, 'appointmentTrend'])->name('admin.appointments-trend');
        Route::get('revenue/trend', [AdminController::class, 'revenueTrend'])->name('admin.revenue-trend');
        Route::get('bed-occupancy', [AdminController::class, 'bedOccupancy'])->name('admin.bed-occupancy');
        Route::get('activity-log', [AdminController::class, 'activityLog'])->name('admin.activity-log');
        Route::get('users', [AdminController::class, 'users'])->name('admin.users');
        Route::post('users', [AdminController::class, 'createUser'])->name('admin.users.store');
        Route::put('users/{id}', [AdminController::class, 'updateUser'])->name('admin.users.update');
        Route::patch('users/{id}/role', [AdminController::class, 'updateUserRole'])->name('admin.users.role');
        Route::delete('users/{id}', [AdminController::class, 'deleteUser'])->name('admin.users.destroy');
    });
});
