<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DoctorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'user_id'        => $this->user_id,
            'name'           => $this->user?->name,
            'email'          => $this->user?->email,
            'specialization' => $this->specialization,
            'qualification'  => $this->qualification,
            'fee'            => $this->fee,
            'phone'          => $this->phone,
            'address'        => $this->address,
            'user'           => new UserResource($this->whenLoaded('user')),
            'schedules'      => DoctorScheduleResource::collection($this->whenLoaded('schedules')),
            'created_at'     => $this->created_at?->toISOString(),
        ];
    }
}
