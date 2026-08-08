<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreAppointmentRequest;
use App\Http\Requests\UpdateAppointmentStatusRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Hms\Core\Enums\AppointmentStatus;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\JsonResponse;

class AppointmentController extends Controller
{
    /**
     * Display a listing of appointments.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Appointment::with(['patient.user', 'doctor.user', 'slot']);
        $user = $request->user();

        // Role-wise forced scoping
        if ($user->hasRole('patient')) {
            $patient = $user->patient;
            if (!$patient) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where('patient_id', $patient->id);
            }
        } elseif ($user->hasRole('doctor')) {
            $doctor = $user->doctor;
            if (!$doctor) {
                $query->whereRaw('1 = 0');
            } else {
                $query->where('doctor_id', $doctor->id);
            }
        } else {
            // Admins/Receptionists can search and filter
            if ($request->has('doctor_id')) {
                $query->where('doctor_id', $request->query('doctor_id'));
            }

            if ($request->has('patient_id')) {
                $query->where('patient_id', $request->query('patient_id'));
            }
        }

        if ($search = $request->query('search')) {
            $query->where(function($q) use ($search) {
                $q->whereHas('patient.user', fn($q) => $q->where('name', 'like', "%{$search}%"))
                  ->orWhereHas('doctor.user', fn($q) => $q->where('name', 'like', "%{$search}%"))
                  ->orWhere('type', 'like', "%{$search}%");
            });
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        // Common filters
        if ($request->has('status')) {
            $query->where('status', $request->query('status'));
        }

        if ($request->has('date')) {
            $query->whereDate('date', $request->query('date'));
        }

        if ($request->has('start_date')) {
            $query->whereDate('date', '>=', $request->query('start_date'));
        }

        if ($request->has('end_date')) {
            $query->whereDate('date', '<=', $request->query('end_date'));
        }

        // Default sorting
        $query->orderBy('date', 'desc')->orderBy('id', 'desc');

        $appointments = $query->paginate($request->query('per_page', 15));

        return AppointmentResource::collection($appointments);
    }

    /**
     * Store a newly created appointment.
     */
    public function store(StoreAppointmentRequest $request, AppointmentService $service): AppointmentResource
    {
        $appointment = $service->book($request->validated(), auth()->user());

        return new AppointmentResource($appointment);
    }

    /**
     * Display the specified appointment.
     */
    public function show(int $id): AppointmentResource
    {
        $appointment = Appointment::with(['patient.user', 'doctor.user', 'slot', 'logs.changedBy'])->findOrFail($id);
        $this->authorize('view', $appointment);

        return new AppointmentResource($appointment);
    }

    /**
     * Update status on the specified appointment.
     */
    public function updateStatus(UpdateAppointmentStatusRequest $request, int $id, AppointmentService $service): AppointmentResource
    {
        $appointment = Appointment::findOrFail($id);
        $this->authorize('update', $appointment);
        $newStatus = AppointmentStatus::from($request->status);
        $updated = $service->updateStatus($appointment, $newStatus, auth()->user());

        return new AppointmentResource($updated);
    }

    /**
     * Store a newly created instant appointment (Emergency, VIP, Walk-in).
     */
    public function instantBook(Request $request, AppointmentService $service): AppointmentResource
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'doctor_id'  => 'required|exists:doctors,id',
            'slot_id'    => 'nullable|exists:time_slots,id',
            'date'       => 'nullable|date',
            'type'       => 'required|string|in:instant,emergency,vip,walk_in',
            'notes'      => 'nullable|string'
        ]);

        $type = \Hms\Core\Enums\AppointmentType::from($validated['type']);
        $appointment = $service->bookInstant($validated, auth()->user(), $type);

        return new AppointmentResource($appointment);
    }

    /**
     * Reschedule an appointment.
     */
    public function reschedule(Request $request, int $id, AppointmentService $service): AppointmentResource
    {
        $validated = $request->validate([
            'slot_id' => 'required|exists:time_slots,id',
            'date'    => 'required|date',
            'notes'   => 'nullable|string'
        ]);

        $appointment = Appointment::findOrFail($id);
        $this->authorize('update', $appointment);
        
        $newAppointment = $service->reschedule($appointment, $validated, auth()->user());

        return new AppointmentResource($newAppointment);
    }

    /**
     * Cancel an appointment with a reason.
     */
    public function cancel(Request $request, int $id, AppointmentService $service): AppointmentResource
    {
        $validated = $request->validate([
            'cancellation_reason' => 'nullable|string|max:255'
        ]);

        $appointment = Appointment::findOrFail($id);
        $this->authorize('update', $appointment);

        $updated = $service->cancel($appointment, auth()->user(), $validated['cancellation_reason'] ?? null);

        return new AppointmentResource($updated);
    }

    /**
     * Remove the specified appointment (soft delete).
     */
    public function destroy(int $id): JsonResponse
    {
        $appointment = Appointment::findOrFail($id);
        $this->authorize('delete', $appointment);
        $appointment->delete();

        return response()->json(['message' => 'Appointment deleted successfully.']);
    }

    /**
     * Download the prescription PDF.
     */
    public function downloadPrescription(int $id)
    {
        $appointment = Appointment::with([
            'patient.user', 
            'doctor.user', 
            'prescription.items.medicine',
            'diagnosis',
            'labRequests.test'
        ])->findOrFail($id);
        $this->authorize('view', $appointment);

        if (!$appointment->prescription) {
            return response()->json(['message' => 'No prescription found for this appointment.'], 404);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.prescription', compact('appointment'));
        return $pdf->download('prescription_' . $appointment->id . '.pdf');
    }

    /**
     * Download the bill PDF.
     */
    public function downloadBill(int $id)
    {
        $appointment = Appointment::with(['patient.user', 'doctor.user', 'bill.items', 'bill.payments'])->findOrFail($id);
        $this->authorize('view', $appointment);

        if (!$appointment->bill) {
            return response()->json(['message' => 'No bill found for this appointment.'], 404);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('pdfs.bill', compact('appointment'));
        return $pdf->download('bill_' . $appointment->id . '.pdf');
    }

}
