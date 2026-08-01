<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMedicineRequest extends FormRequest
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
            'name'            => ['required', 'string', 'max:255'],
            'generic_name'    => ['nullable', 'string', 'max:255'],
            'unit'            => ['required', 'string', 'max:50'],
            'price'           => ['required', 'numeric', 'min:0'],
            'stock_threshold' => ['required', 'integer', 'min:0'],
        ];
    }
}
