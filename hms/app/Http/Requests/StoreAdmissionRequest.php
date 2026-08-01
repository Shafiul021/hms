<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreAdmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Role checked via route middleware
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'patient_id'  => ['required', 'integer', 'exists:patients,id'],
            'bed_id'      => ['required', 'integer', 'exists:beds,id'],
            'doctor_id'   => ['required', 'integer', 'exists:doctors,id'],
            'reason'      => ['required', 'string', 'max:500'],
            'notes'       => ['nullable', 'string', 'max:2000'],
            'admitted_at' => ['nullable', 'date'],
        ];
    }

    /**
     * Custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'A patient must be selected for admission.',
            'patient_id.exists'   => 'The selected patient does not exist.',
            'bed_id.required'     => 'A bed must be selected.',
            'bed_id.exists'       => 'The selected bed does not exist.',
            'doctor_id.required'  => 'An admitting doctor must be specified.',
            'reason.required'     => 'An admission reason is required.',
            'reason.max'          => 'Admission reason may not exceed 500 characters.',
        ];
    }
}
