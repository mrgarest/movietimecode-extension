<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

class SuccessResource extends JsonResource
{
    // Disable the standard ‘data’ wrapper
    public static $wrap = null;

    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Checks whether data exists in the resource; if not, returns an empty array.
        return is_array($this->resource) ? $this->resource : [];
    }

    /**
     * Redefining the response to add success: true
     */
    public function toResponse($request): JsonResponse
    {
        return response()->json(array_merge(
            ['success' => true],
            $this->toArray($request instanceof Request ? $request : request())
        ), 200);
    }
}