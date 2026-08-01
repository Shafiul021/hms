<?php

namespace Hms\Notifications\Templates;

use App\Models\Appointment;

/**
 * AppointmentMailTemplate
 *
 * Centralises all mail template data building for appointment-related emails.
 * Used by AppointmentStatusMail (and any future appointment mailers) to avoid
 * duplicating view-data logic across multiple Mailable classes.
 *
 * Usage:
 *
 *   $data = AppointmentMailTemplate::build($appointment);
 *   // $data['subject'], $data['patient'], $data['doctor'], $data['details']
 */
class AppointmentMailTemplate
{
    /**
     * Build the full view-data array for an appointment status email.
     *
     * @param  \App\Models\Appointment  $appointment
     * @return array{
     *     subject: string,
     *     appointment: \App\Models\Appointment,
     *     patient: mixed,
     *     doctor: mixed,
     *     details: array<string, string>,
     *     statusLabel: string,
     *     isCancelled: bool,
     *     isConfirmed: bool,
     * }
     */
    public static function build(Appointment $appointment): array
    {
        // Ensure relations are loaded
        $appointment->loadMissing(['patient', 'doctor', 'patient.user']);

        $statusValue = $appointment->status->value ?? 'updated';
        $statusLabel = ucfirst($statusValue);

        $patientName = $appointment->patient?->name
            ?? $appointment->patient?->full_name
            ?? 'Patient';

        $doctorName = $appointment->doctor?->name
            ?? $appointment->doctor?->full_name
            ?? 'N/A';

        $speciality  = $appointment->doctor?->specialization
            ?? $appointment->doctor?->speciality
            ?? 'N/A';

        // Prefer appointment_date column; fall back to date + slot time
        $dateFormatted = self::formatAppointmentDate($appointment);
        $timeFormatted = self::formatAppointmentTime($appointment);

        return [
            'subject'     => "Your Appointment has been {$statusLabel}",
            'appointment' => $appointment,
            'patient'     => $appointment->patient,
            'doctor'      => $appointment->doctor,
            'statusLabel' => $statusLabel,
            'isCancelled' => $statusValue === 'cancelled',
            'isConfirmed' => $statusValue === 'confirmed',
            'details'     => [
                'patient_name' => $patientName,
                'doctor_name'  => "Dr. {$doctorName}",
                'speciality'   => $speciality,
                'date'         => $dateFormatted,
                'time'         => $timeFormatted,
                'notes'        => $appointment->notes ?? '—',
            ],
        ];
    }

    /**
     * Build just the email subject line for an appointment.
     *
     * @param  \App\Models\Appointment  $appointment
     * @return string
     */
    public static function subject(Appointment $appointment): string
    {
        $status = ucfirst($appointment->status->value ?? 'Updated');
        return "Your Appointment has been {$status}";
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    private static function formatAppointmentDate(Appointment $appointment): string
    {
        // appointment_date may be a datetime string or Carbon
        if (isset($appointment->appointment_date)) {
            try {
                return \Carbon\Carbon::parse($appointment->appointment_date)
                    ->format('D, d M Y');
            } catch (\Throwable) {}
        }

        if (isset($appointment->date)) {
            try {
                return \Carbon\Carbon::parse($appointment->date)
                    ->format('D, d M Y');
            } catch (\Throwable) {}
        }

        return 'N/A';
    }

    private static function formatAppointmentTime(Appointment $appointment): string
    {
        if (isset($appointment->appointment_time)) {
            try {
                return \Carbon\Carbon::parse($appointment->appointment_time)
                    ->format('h:i A');
            } catch (\Throwable) {}
        }

        // Derive time from appointment_date datetime if present
        if (isset($appointment->appointment_date)) {
            try {
                $dt = \Carbon\Carbon::parse($appointment->appointment_date);
                if ($dt->hour !== 0 || $dt->minute !== 0) {
                    return $dt->format('h:i A');
                }
            } catch (\Throwable) {}
        }

        return 'N/A';
    }
}
