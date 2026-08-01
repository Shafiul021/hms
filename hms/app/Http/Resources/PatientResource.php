<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PatientResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id'                         => $this->id,
            'user_id'                    => $this->user_id,
            'patient_code'               => $this->patient_code,
            'dob'                        => $this->dob?->format('Y-m-d'),
            'date_of_birth'              => $this->dob?->format('Y-m-d'),
            'blood_type'                 => $this->blood_type,
            'gender'                     => $this->gender,
            'name'                       => $this->user?->name,
            'email'                      => $this->user?->email,
            'age'                        => $this->dob ? \Carbon\Carbon::parse($this->dob)->age : null,
            'phone'                      => $this->phone,
            'address'                    => $this->address,
            'weight'                     => $this->weight,
            'height'                     => $this->height,
            'emergency_contact_name'     => $this->emergencyContacts->first()?->name,
            'emergency_contact_relation' => $this->emergencyContacts->first()?->relationship,
            'emergency_contact_phone'    => $this->emergencyContacts->first()?->phone,
            'user'                       => new UserResource($this->whenLoaded('user')),
            'allergies'                  => AllergyResource::collection($this->whenLoaded('allergies')),
            'emergency_contacts'         => EmergencyContactResource::collection($this->whenLoaded('emergencyContacts')),
            'created_at'                 => $this->created_at?->toISOString(),
        ];
    }
}
