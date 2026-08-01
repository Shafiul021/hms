<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation()
    {
        if ($this->user() && $this->user()->hasRole('patient')) {
            $this->merge([
                'patient_id' => $this->user()->patient?->id,
            ]);
        }
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'patient_id' => 'required|integer|exists:patients,id',
            'doctor_id'  => 'required|integer|exists:doctors,id',
            'slot_id'    => 'required|integer|exists:time_slots,id',
            'date'       => 'required|date|after_or_equal:today',
            'notes'      => 'nullable|string|max:1000',
        ];
    }

    /**
     * Custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'patient_id.required' => 'A patient must be selected.',
            'patient_id.exists'   => 'The selected patient does not exist.',
            'doctor_id.required'  => 'A doctor must be selected.',
            'doctor_id.exists'    => 'The selected doctor does not exist.',
            'slot_id.required'    => 'A time slot must be selected.',
            'slot_id.exists'      => 'The selected time slot is not available.',
            'date.required'       => 'An appointment date is required.',
            'date.after_or_equal' => 'The appointment date must be today or in the future.',
        ];
    }
}
