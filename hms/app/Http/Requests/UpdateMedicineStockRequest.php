<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateMedicineStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'batch_no'    => ['required', 'string', 'max:100'],
            'quantity'    => ['required', 'integer', 'min:1'],
            'expiry_date' => ['required', 'date', 'after:today'],
        ];
    }
}
