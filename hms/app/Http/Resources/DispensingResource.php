<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DispensingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'prescription_id' => $this->prescription_id,
            'pharmacist_id'   => $this->pharmacist_id,
            'dispensed_at'    => $this->dispensed_at?->toIso8601String(),
            'notes'           => $this->notes,
            'prescription'    => new PrescriptionResource($this->whenLoaded('prescription')),
            'pharmacist'      => new UserResource($this->whenLoaded('pharmacist')),
            'created_at'      => $this->created_at?->toIso8601String(),
            'updated_at'      => $this->updated_at?->toIso8601String(),
        ];
    }
}
