<?php

namespace App\Providers;

use App\Models\Patient;
use App\Models\Doctor;
use App\Observers\PatientObserver;
use App\Observers\DoctorObserver;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Auto-generate HMS-YYYY-XXXXX patient_code on create
        Patient::observe(PatientObserver::class);

        // Auto-seed doctor schedule and slots on create
        Doctor::observe(DoctorObserver::class);

        // Log appointment status transitions
        \App\Models\Appointment::observe(\App\Observers\AppointmentObserver::class);

        // Register Policies
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Appointment::class, \App\Policies\AppointmentPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\Bill::class, \App\Policies\BillPolicy::class);
        \Illuminate\Support\Facades\Gate::policy(\App\Models\LabResult::class, \App\Policies\LabResultPolicy::class);
    }
}
