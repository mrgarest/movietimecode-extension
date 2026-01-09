<?php

namespace App\Http\Resources;

use Illuminate\Contracts\Support\Responsable;
use Illuminate\Http\JsonResponse;

class ErrorResource implements Responsable
{
    /**
     * @param string $message  Short description of the error for humans
     * @param int $status HTTP status code (400, 403, 422, etc.)
     * @param string|null $errorCode Machine-readable code (e.g., DEVICE_FAILED)
     * @param array $details Additional error data (e.g., array of validation errors)
     */
    public function __construct(
        protected string $code,
        protected int $status,
        protected ?string $message = null,
        protected ?array $details = null
    ) {}

    /**
     * Static method for creation (Factory Method)
     */
    public static function make(
        string $code,
        int $status,
        ?string $message = null,
        ?array $details = null
    ): self {
        return new static(
            code: $code,
            status: $status,
            message: $message !== '' ? $message : null,
            details: $details
        );
    }

    /**
     * Converts an object into a Laravel JSON response.
     */
    public function toResponse($request): JsonResponse
    {
        $error = [
            'status' => $this->status,
            'code' => $this->code
        ];

        if ($this->message) $error['message'] = $this->message;
        if (!empty($this->details)) $error['details'] = $this->details;
        return response()->json([
            'success' => false,
            'error' => $error
        ], $this->status);
    }
}
