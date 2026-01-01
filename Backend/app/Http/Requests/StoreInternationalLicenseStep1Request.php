<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInternationalLicenseStep1Request extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:20'],
            'nationality' => ['required', 'string', Rule::in(['syrian', 'non_syrian'])],
            'birthdate' => ['nullable', 'date'],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }
}
