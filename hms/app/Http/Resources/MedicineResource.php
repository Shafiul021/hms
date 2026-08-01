<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MedicineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'generic_name'    => $this->generic_name,
            'unit'            => $this->unit,
            'price'           => $this->price,
            'stock_threshold' => $this->stock_threshold,
            'total_stock'     => $this->batches->sum('quantity'),
            'low_stock'       => $this->batches->sum('quantity') <= $this->stock_threshold,
            'batches'         => $this->whenLoaded('batches', fn () =>
                $this->batches->map(fn ($b) => [
                    'id'          => $b->id,
                    'batch_no'    => $b->batch_no,
                    'quantity'    => $b->quantity,
                    'expiry_date' => $b->expiry_date?->toDateString(),
                ])
            ),
            'created_at'      => $this->created_at?->toIso8601String(),
            'updated_at'      => $this->updated_at?->toIso8601String(),
        ];
    }
}
