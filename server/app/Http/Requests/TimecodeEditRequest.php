<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TimecodeEditRequest extends FormRequest
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
            'duration' => 'required|integer|min:1',

            'content_classifications' => 'nullable|array',
            'content_classifications.*' => 'integer',
            
            'segments' => 'nullable|array',
            'segments.*.id' => 'nullable|integer',
            'segments.*.tag_id' => 'required|integer',
            'segments.*.start_time' => 'required|integer|min:0',
            'segments.*.end_time' => 'required|integer|min:0|gt:segments.*.start_time',
            'segments.*.description' => 'nullable|string|max:255',
        ];
    }
}
