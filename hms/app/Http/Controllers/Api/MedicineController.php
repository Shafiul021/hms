<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreMedicineRequest;
use App\Http\Requests\UpdateMedicineStockRequest;
use App\Http\Resources\MedicineResource;
use App\Jobs\LowStockAlert;
use App\Models\Medicine;
use App\Models\MedicineBatch;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MedicineController extends Controller
{
    /**
     * Paginated medicine inventory with optional search.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Medicine::with('batches');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('generic_name', 'like', "%{$search}%");
            });
        }

        if ($request->boolean('all')) {
            $medicines = $query->get();
            return MedicineResource::collection($medicines);
        }

        $medicines = $query->paginate($request->query('per_page', 20));

        return MedicineResource::collection($medicines);
    }

    /**
     * Add a new medicine to inventory.
     */
    public function store(StoreMedicineRequest $request): MedicineResource
    {
        $data = $request->validated();
        $data['created_by'] = auth()->id() ?? 1; // Default to 1 if no auth (e.g. testing)

        $medicine = Medicine::create($data);

        return new MedicineResource($medicine->load('batches'));
    }

    /**
     * Add a new stock batch to a medicine; dispatch LowStockAlert if needed.
     */
    public function updateStock(UpdateMedicineStockRequest $request, int $id): MedicineResource
    {
        $medicine = Medicine::with('batches')->findOrFail($id);

        MedicineBatch::create(array_merge(
            $request->validated(),
            ['medicine_id' => $medicine->id]
        ));

        // Re-query fresh batches to get updated stock
        $medicine->load('batches');
        $totalStock = $medicine->batches->sum('quantity');

        if ($totalStock <= $medicine->stock_threshold) {
            LowStockAlert::dispatch($medicine, $totalStock);
        }

        return new MedicineResource($medicine);
    }
}
