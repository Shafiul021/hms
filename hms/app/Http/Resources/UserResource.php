<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * NOTE: password is intentionally never returned.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'name'       => $this->name,
            'email'      => $this->email,
            'roles'      => $this->getRoleNames(),       // Spatie: ['admin']
            'patient_id' => $this->patient?->id,
            'doctor_id'  => $this->doctor?->id,
            'doctor'     => $this->doctor ? [
                'id'             => $this->doctor->id,
                'specialization' => $this->doctor->specialization,
                'qualification'  => $this->doctor->qualification,
                'fee'            => (float) $this->doctor->fee,
                'phone'          => $this->doctor->phone,
            ] : null,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
