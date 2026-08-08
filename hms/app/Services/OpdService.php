<?php

namespace App\Services;

use App\Models\Appointment;
use App\Models\Diagnosis;
use App\Models\LabRequest;
use App\Models\LabResult;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use Hms\Core\Enums\LabRequestStatus;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class OpdService
{
    /**
     * Create a diagnosis linked to an appointment.
     */
    public function createDiagnosis(array $data, int $doctorId): Diagnosis
    {
        $appointment = Appointment::findOrFail($data['appointment_id']);

        if (!empty($data['symptom_ids'])) {
            $appointment->symptoms()->sync($data['symptom_ids']);
        }

        // Custom symptoms can be appended to notes or a new field, let's append to notes
        $notes = $data['notes'] ?? null;
        if (!empty($data['custom_symptoms'])) {
            $notes = $notes ? $notes . "\n\nCustom Symptoms: " . $data['custom_symptoms'] : "Custom Symptoms: " . $data['custom_symptoms'];
        }

        return Diagnosis::create([
            'appointment_id' => $appointment->id,
            'doctor_id'      => $doctorId,
            'patient_id'     => $appointment->patient_id,
            'icd_code'       => $data['icd_code'] ?? null,
            'description'    => $data['description'],
            'notes'          => $notes,
            'physical_examination' => $data['physical_examination'] ?? null,
            'diagnosed_at'   => $data['diagnosed_at'] ?? now(),
        ]);
    }

    /**
     * Create a prescription with items linked to an appointment.
     */
    public function createPrescription(array $data, int $doctorId): Prescription
    {
        return DB::transaction(function () use ($data, $doctorId) {
            $appointment = Appointment::findOrFail($data['appointment_id']);

            $prescription = Prescription::create([
                'appointment_id' => $appointment->id,
                'doctor_id'      => $doctorId,
                'patient_id'     => $appointment->patient_id,
                'notes'          => $data['notes'] ?? null,
            ]);

            foreach ($data['items'] as $item) {
                $medicineId = $item['medicine_id'] ?? null;

                if (!$medicineId && !empty($item['medicine_name'])) {
                    $medicine = \App\Models\Medicine::firstOrCreate(
                        ['name' => $item['medicine_name']],
                        [
                            'generic_name'    => $item['medicine_name'], // fallback
                            'unit'            => 'units', // fallback
                            'price'           => 0, // fallback
                            'stock_threshold' => 10,
                            'created_by'      => auth()->id(),
                        ]
                    );
                    $medicineId = $medicine->id;
                }

                if ($medicineId) {
                    PrescriptionItem::create([
                        'prescription_id' => $prescription->id,
                        'medicine_id'     => $medicineId,
                        'dosage'          => $item['dosage'],
                        'frequency'       => $item['frequency'],
                        'duration'        => $item['duration'],
                    ]);
                }
            }

            return $prescription->load('items.medicine', 'doctor.user', 'patient.user');
        });
    }

    /**
     * Create a lab request linked to an appointment.
     */
    public function createLabRequest(array $data, int $doctorId): LabRequest
    {
        $appointment = Appointment::findOrFail($data['appointment_id']);

        $labRequest = LabRequest::create([
            'appointment_id' => $appointment->id,
            'doctor_id'      => $doctorId,
            'patient_id'     => $appointment->patient_id,
            'test_id'        => $data['test_id'],
            'status'         => LabRequestStatus::Requested,
            'requested_at'   => now(),
        ]);

        return $labRequest->load('test', 'doctor.user', 'patient.user');
    }

    /**
     * Update/upload a lab result for a given lab request.
     */
    public function uploadLabResult(LabRequest $labRequest, array $data, int $technicianId): LabResult
    {
        return DB::transaction(function () use ($labRequest, $data, $technicianId) {
            $filePath = null;

            if (isset($data['result_file']) && $data['result_file'] instanceof UploadedFile) {
                $filePath = $data['result_file']->store(
                    "lab-results/{$labRequest->patient_id}",
                    'private'
                );
            }

            // Create or update result
            $result = LabResult::updateOrCreate(
                ['lab_request_id' => $labRequest->id],
                [
                    'technician_id' => $technicianId,
                    'result_file'   => $filePath,
                    'notes'         => $data['notes'] ?? null,
                    'is_abnormal'   => $data['is_abnormal'] ?? false,
                    'result_at'     => $data['result_at'] ?? now(),
                ]
            );

            // Mark the lab request as completed
            $labRequest->update(['status' => LabRequestStatus::Completed]);

            return $result->load('labRequest.test', 'technician');
        });
    }

    /**
     * Get the storage path for a lab result file.
     */
    public function getResultFilePath(LabResult $result): ?string
    {
        if (! $result->result_file) {
            return null;
        }

        return Storage::disk('private')->path($result->result_file);
    }
}
