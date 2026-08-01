<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBillRequest;
use App\Http\Resources\BillResource;
use App\Models\Bill;
use App\Services\BillingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Barryvdh\DomPDF\Facade\Pdf;

class BillingController extends Controller
{
    protected BillingService $billingService;

    public function __construct(BillingService $billingService)
    {
        $this->billingService = $billingService;
    }

    /**
     * Paginated bill index.
     * Admin/receptionist see all bills; patients see only their own.
     */
    public function index(Request $request): \Illuminate\Http\Resources\Json\AnonymousResourceCollection
    {
        $user = $request->user();
        $query = \App\Models\Bill::with(['patient.user']);

        // Scope to own bills for patients
        if ($user->hasRole('patient')) {
            $query->whereHas('patient', fn ($q) => $q->where('user_id', $user->id));
        }

        // Optional status filter
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        // Optional search by patient name
        if ($search = $request->query('search')) {
            $query->whereHas('patient.user', fn ($q) => $q->where('name', 'like', "%{$search}%"));
        }

        $bills = $query->latest()->paginate($request->query('per_page', 15));

        return BillResource::collection($bills);
    }

    /**
     * Auto-generate a bill from an appointment.
     */
    public function generate(StoreBillRequest $request): JsonResponse|BillResource
    {
        try {
            $bill = $this->billingService->generate($request->validated());
            
            return new BillResource(
                $bill->load(['patient.user', 'appointment.doctor.user', 'items', 'payments'])
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Display the specified bill.
     */
    public function show(int $id): JsonResponse|BillResource
    {
        $bill = Bill::with([
            'patient.user', 
            'appointment.doctor.user', 
            'items', 
            'payments.recordedBy'
        ])->findOrFail($id);

        $this->authorize('view', $bill);

        return new BillResource($bill);
    }

    /**
     * Download the invoice as a PDF.
     */
    public function downloadPdf(int $id)
    {
        $bill = Bill::with([
            'patient.user', 
            'appointment.doctor.user', 
            'items', 
            'payments.recordedBy'
        ])->findOrFail($id);

        $this->authorize('view', $bill);

        $pdf = Pdf::loadView('pdf.invoice', compact('bill'));
        
        return $pdf->download("invoice_{$bill->id}.pdf");
    }
}
