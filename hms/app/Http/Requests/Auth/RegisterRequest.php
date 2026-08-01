<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    /**
     * Any authenticated user may hit the register endpoint (open registration).
     * To restrict registration to admins only, change this to:
     *   return $this->user()?->hasRole('admin');
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Validation rules for a new user registration.
     */
    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role'     => ['sometimes', 'string', 'in:admin,doctor,receptionist,nurse,patient'],
        ];
    }

    /**
     * Custom human-readable attribute names for error messages.
     */
    public function attributes(): array
    {
        return [
            'password' => 'password',
        ];
    }

    /**
     * Custom validation error messages.
     */
    public function messages(): array
    {
        return [
            'name.required'            => 'A name is required to register.',
            'email.required'           => 'An email address is required.',
            'email.unique'             => 'This email address is already registered.',
            'email.email'              => 'Please provide a valid email address.',
            'password.required'        => 'A password is required.',
            'password.min'             => 'Password must be at least 8 characters.',
            'password.confirmed'       => 'Password confirmation does not match.',
            'role.in'                  => 'The selected role is not valid.',
        ];
    }
}
