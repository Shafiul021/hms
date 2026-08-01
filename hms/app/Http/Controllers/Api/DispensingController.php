<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDispensingRequest;
use App\Http\Resources\DispensingResource;
use App\Jobs\LowStockAlert;
use App\Models\Dispensing;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use App\Models\Prescription;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class DispensingController extends Controller
{
    /**
     * Record prescription fulfilment with FIFO batch deduction by expiry date.
     */
    public function store(StoreDispensingRequest $request): DispensingResource|JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $prescription = Prescription::with([
                'items.medicine.batches',
                'dispensing',
            ])->findOrFail($request->prescription_id);

            if ($prescription->dispensing) {
                return response()->json([
                    'message' => 'This prescription has already been dispensed.',
                ], 422);
            }

            // FIFO deduction: for each prescription item, deduct from earliest-expiring batches first
            foreach ($prescription->items as $item) {
                // prescription_items has no quantity column; deduct 1 unit per item
                $needed = 1;
                $medicine = $item->medicine;

                // Batches ordered by expiry ASC (oldest first = FIFO)
                $batches = MedicineBatch::where('medicine_id', $medicine->id)
                    ->where('quantity', '>', 0)
                    ->orderBy('expiry_date', 'asc')
                    ->get();

                $available = $batches->sum('quantity');
                if ($available < $needed) {
                    return response()->json([
                        'message' => "Insufficient stock for medicine: {$medicine->name}. "
                            . "Required: {$needed}, Available: {$available}.",
                    ], 422);
                }

                // Deduct across batches
                foreach ($batches as $batch) {
                    if ($needed <= 0) {
                        break;
                    }
                    $deduct = min($batch->quantity, $needed);
                    $batch->decrement('quantity', $deduct);
                    $needed -= $deduct;
                }

                // Check for low stock after deduction
                $medicine->load('batches');
                $totalStock = $medicine->batches->sum('quantity');
                if ($totalStock <= $medicine->stock_threshold) {
                    LowStockAlert::dispatch($medicine, $totalStock);
                }
            }

            // Record the dispensing
            $dispensing = Dispensing::create([
                'prescription_id' => $prescription->id,
                'pharmacist_id'   => auth()->id(),
                'dispensed_at'    => now(),
                'notes'           => $request->notes,
            ]);

            return new DispensingResource(
                $dispensing->load(['prescription.items.medicine', 'pharmacist'])
            );
        });
    }
}
