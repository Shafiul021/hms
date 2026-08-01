<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class LoginRequest extends FormRequest
{
    /**
     * Login is open to unauthenticated users.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for user login.
     */
    public function rules(): array
    {
        return [
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * Custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'email.required'    => 'An email address is required to log in.',
            'email.email'       => 'Please provide a valid email address.',
            'password.required' => 'A password is required to log in.',
        ];
    }
}
