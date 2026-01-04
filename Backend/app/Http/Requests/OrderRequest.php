<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class OrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        // Prevent providers from creating orders
        $user = $this->user();
        if ($user && isset($user->role) && $user->role === 'provider') {
            return false;
        }
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'form_data' => 'required|array',
            'form_data.category' => 'required|string',
            'form_data.brand' => 'nullable|string',
            'form_data.brandManual' => 'nullable|string',
            'form_data.model' => 'nullable|string',
            'form_data.year' => 'nullable|string',
            // Voice note OR text description is acceptable
            'form_data.partDescription' => 'required_without:form_data.voiceNote|nullable|string',
            'form_data.voiceNote' => 'required_without:form_data.partDescription|nullable', // Assuming string or file? Controller logic suggested nullable presence check
            'form_data.city' => 'required|string',
            'form_data.contactMethod' => 'required|in:whatsapp,call,email',
            'form_data.partTypes' => 'required|array',
            'customer_name' => 'nullable|string',
            'customer_address' => 'nullable|string',
            'customer_phone' => 'nullable|string',
            'delivery_method' => 'nullable|in:shipping,pickup',
        ];
    }

    public function messages(): array
    {
        return [
            'form_data.partDescription.required_without' => 'يرجى كتابة وصف للقطعة أو تسجيل رسالة صوتية',
            'form_data.voiceNote.required_without' => 'يرجى كتابة وصف للقطعة أو تسجيل رسالة صوتية',
        ];
    }
}
