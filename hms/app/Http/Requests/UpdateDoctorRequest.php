<?php

namespace App\Http\Requests;

use App\Models\Doctor;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDoctorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $doctorId = $this->route('id');
        $doctor = Doctor::find($doctorId);
        $userId = $doctor ? $doctor->user_id : null;

        return [
            'name'           => 'sometimes|required|string|max:255',
            'email'          => 'sometimes|required|string|email|max:255|unique:users,email,' . $userId,
            'password'       => 'nullable|string|min:8',
            'specialization' => 'sometimes|required|string|max:255',
            'qualification'  => 'sometimes|required|string|max:255',
            'fee'            => 'sometimes|required|numeric|min:0',
            'phone'          => 'sometimes|nullable|string|max:20',
            'address'        => 'sometimes|nullable|string|max:255',
        ];
    }
}
