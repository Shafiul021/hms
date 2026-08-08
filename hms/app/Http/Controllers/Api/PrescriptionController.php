<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StorePrescriptionRequest;
use App\Http\Resources\PrescriptionResource;
use App\Models\Prescription;
use App\Services\OpdService;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PrescriptionController extends Controller
{
    /**
     * Store a newly created prescription with items for an appointment.
     *
     * POST /api/prescriptions
     * Role: doctor
     */
    public function store(StorePrescriptionRequest $request, OpdService $service): PrescriptionResource
    {
        $doctor       = auth()->user()->doctor;
        $prescription = $service->createPrescription($request->validated(), $doctor->id);

        return new PrescriptionResource($prescription);
    }

    /**
     * Display the specified prescription with items.
     *
     * GET /api/prescriptions/{id}
     * Role: admin|doctor|patient|nurse|receptionist
     */
    public function show(int $id): PrescriptionResource
    {
        $prescription = Prescription::with([
            'doctor.user',
            'patient.user',
            'appointment.diagnosis',
            'appointment.labRequests.test',
            'appointment.symptoms',
            'items.medicine.batches',
            'dispensing',
        ])->findOrFail($id);

        return new PrescriptionResource($prescription);
    }
    /**
     * Display a listing of prescriptions.
     *
     * GET /api/prescriptions
     */
    public function index(\Illuminate\Http\Request $request): AnonymousResourceCollection
    {
        $query = Prescription::with([
            'doctor.user',
            'patient.user',
            'appointment',
            'dispensing',
        ]);

        if ($request->has('status')) {
            if ($request->status === 'dispensed') {
                $query->whereHas('dispensing');
            } elseif ($request->status === 'pending') {
                $query->whereDoesntHave('dispensing');
            }
        }

        // Apply pagination or return all
        if ($request->boolean('all')) {
            return PrescriptionResource::collection($query->latest()->get());
        }

        return PrescriptionResource::collection($query->latest()->paginate(15));
    }

    /**
     * Download the specified prescription as a PDF.
     *
     * GET /api/prescriptions/{id}/pdf
     */
    public function downloadPdf(int $id)
    {
        $prescription = Prescription::with([
            'doctor.user',
            'patient.user',
            'appointment',
            'items.medicine',
            'dispensing.pharmacist',
        ])->findOrFail($id);

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdf.prescription', compact('prescription'));

        return $pdf->download("prescription_{$prescription->id}.pdf");
    }
}
