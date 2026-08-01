<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Admission;
use App\Models\Appointment;
use App\Models\Bill;
use App\Models\Bed;
use App\Models\Doctor;
use App\Models\Patient;
use App\Models\User;
use Hms\Core\Enums\AppointmentStatus;
use Hms\Core\Enums\BedStatus;
use Hms\Core\Enums\BillStatus;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class AdminController extends Controller
{
    /**
     * Dashboard KPI stats.
     */
    public function stats(): JsonResponse
    {
        $revenueThisMonth = Bill::where('status', BillStatus::Paid)
            ->whereYear('issued_at', now()->year)
            ->whereMonth('issued_at', now()->month)
            ->sum('paid_amount');

        return response()->json([
            'total_patients'          => Patient::count(),
            'total_doctors'           => Doctor::count(),
            'appointments_today'      => Appointment::whereDate('date', today())->count(),
            'revenue_this_month'      => (float) $revenueThisMonth,
            'available_beds'          => Bed::where('status', BedStatus::Available)->count(),
            'occupied_beds'           => Bed::where('status', BedStatus::Occupied)->count(),
        ]);
    }

    /**
     * Monthly appointment count for last 12 months.
     */
    public function appointmentTrend(): JsonResponse
    {
        $data = Appointment::where('date', '>=', now()->subMonths(12)->startOfMonth())
            ->get(['date'])
            ->groupBy(fn ($a) => $a->date->format('Y-m'))
            ->map(fn ($group, $period) => ['period' => $period, 'count' => $group->count()])
            ->sortKeys()
            ->values();

        return response()->json(['data' => $data]);
    }

    /**
     * Monthly revenue for last 12 months.
     */
    public function revenueTrend(): JsonResponse
    {
        $data = Bill::where('status', BillStatus::Paid)
            ->where('issued_at', '>=', now()->subMonths(12)->startOfMonth())
            ->get(['issued_at', 'paid_amount'])
            ->groupBy(fn ($b) => $b->issued_at->format('Y-m'))
            ->map(fn ($group, $period) => [
                'period'  => $period,
                'revenue' => (float) $group->sum('paid_amount'),
            ])
            ->sortKeys()
            ->values();

        return response()->json(['data' => $data]);
    }

    /**
     * Current bed occupancy breakdown per ward.
     */
    public function bedOccupancy(): JsonResponse
    {
        $wards = \App\Models\Ward::with('beds')->get()->map(fn ($ward) => [
            'ward'       => $ward->name,
            'type'       => $ward->type,
            'available'  => $ward->beds->where('status', BedStatus::Available)->count(),
            'occupied'   => $ward->beds->where('status', BedStatus::Occupied)->count(),
            'maintenance'=> $ward->beds->where('status', BedStatus::Maintenance)->count(),
            'total'      => $ward->beds->count(),
        ]);

        return response()->json(['data' => $wards]);
    }

    /**
     * Paginated activity log.
     */
    public function activityLog(): JsonResponse
    {
        $logs = \App\Models\ActivityLog::with('causer')->latest()->paginate(20);

        $formattedLogs = collect($logs->items())->map(function ($log) {
            return [
                'id'           => $log->id,
                'description'  => $log->description,
                'log_name'     => $log->log_name,
                'subject_type' => $log->subject_type,
                'subject_id'   => $log->subject_id,
                'event'        => $log->event,
                'causer'       => $log->causer ? [
                    'id'    => $log->causer->id,
                    'name'  => $log->causer->name,
                    'email' => $log->causer->email,
                ] : null,
                'properties'   => $log->properties,
                'created_at'   => $log->created_at?->toIso8601String(),
            ];
        });

        return response()->json([
            'data' => $formattedLogs,
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page'    => $logs->lastPage(),
                'total'        => $logs->total(),
            ]
        ]);
    }

    /**
     * List all staff users (non-patient roles) with their roles.
     */
    public function users(): JsonResponse
    {
        $users = User::with('roles')
            ->whereHas('roles', fn ($q) => $q->whereNotIn('name', ['patient']))
            ->paginate(20);

        return response()->json([
            'data' => UserResource::collection($users),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page'    => $users->lastPage(),
                'total'        => $users->total(),
            ],
        ]);
    }

    /**
     * Create a new staff account with a role.
     */
    public function createUser(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'role'     => ['required', 'string', 'in:admin,doctor,receptionist,nurse'],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => bcrypt($validated['password']),
        ]);

        $user->assignRole($validated['role']);

        // Return as a proper JsonResource so the 'data' wrapper is applied
        return (new UserResource($user->load('roles')))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * Change a user's role.
     */
    public function updateUserRole(Request $request, int $id): \Illuminate\Http\JsonResponse|\Illuminate\Http\Resources\Json\JsonResource
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:admin,doctor,receptionist,nurse,patient'],
        ]);

        $user = User::findOrFail($id);
        $user->syncRoles([$validated['role']]);

        return new UserResource($user->load('roles'));
    }

    /**
     * Update a user's name, email, and/or password.
     */
    public function updateUser(Request $request, int $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'     => ['sometimes', 'required', 'string', 'max:255'],
            'email'    => ['sometimes', 'required', 'email', 'unique:users,email,' . $id],
            'password' => ['sometimes', 'nullable', 'string', 'min:8'],
            'role'     => ['sometimes', 'required', 'string', 'in:admin,doctor,receptionist,nurse,patient'],
        ]);

        if (isset($validated['name']))     $user->name  = $validated['name'];
        if (isset($validated['email']))    $user->email = $validated['email'];
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        if (isset($validated['role'])) {
            $user->syncRoles([$validated['role']]);
        }

        return (new UserResource($user->load('roles')))
            ->response()
            ->setStatusCode(200);
    }

    /**
     * Soft-delete a user account.
     * An admin cannot delete their own account.
     */
    public function deleteUser(Request $request, int $id): JsonResponse
    {
        /** @var User $authUser */
        $authUser = $request->user();

        if ($authUser->id === $id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 403);
        }

        $user = User::findOrFail($id);
        $user->delete(); // soft delete

        return response()->json(['message' => 'User deleted successfully.'], 200);
    }
}
