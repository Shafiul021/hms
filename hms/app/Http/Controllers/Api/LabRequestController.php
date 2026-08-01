<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLabRequestRequest;
use App\Http\Resources\LabRequestResource;
use App\Services\OpdService;

class LabRequestController extends Controller
{
    /**
     * Store a newly created lab request for an appointment.
     *
     * POST /api/lab-requests
     * Role: doctor
     */
    public function store(StoreLabRequestRequest $request, OpdService $service): LabRequestResource
    {
        $doctor     = auth()->user()->doctor;
        $labRequest = $service->createLabRequest($request->validated(), $doctor->id);

        return new LabRequestResource($labRequest);
    }

    /**
     * List all lab requests.
     *
     * GET /api/lab-requests
     * Role: admin|doctor|nurse|patient
     */
    public function index(\Illuminate\Http\Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $query = \App\Models\LabRequest::with(['test', 'patient.user', 'doctor.user', 'result']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if (auth()->user()->role === 'patient') {
            $query->where('patient_id', auth()->user()->patient->id);
        }

        $requests = $query->latest()->paginate($request->get('per_page', 15));

        return LabRequestResource::collection($requests);
    }

    /**
     * Display the specified lab request.
     *
     * GET /api/lab-requests/{id}
     * Role: admin|doctor|nurse|patient
     */
    public function show(int $id): LabRequestResource
    {
        $labRequest = \App\Models\LabRequest::with(['test', 'patient.user', 'doctor.user', 'result'])->findOrFail($id);

        if (auth()->user()->role === 'patient') {
            if ($labRequest->patient_id !== auth()->user()->patient->id) {
                abort(403, 'Forbidden');
            }
        }

        return new LabRequestResource($labRequest);
    }
}
