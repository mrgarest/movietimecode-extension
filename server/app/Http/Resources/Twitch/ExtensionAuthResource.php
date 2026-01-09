<?php

namespace App\Http\Resources\Twitch;

use App\Http\Resources\SuccessResource;
use Illuminate\Http\Request;

class TwitchTokenResource extends SuccessResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'access_token' => $this->resource->accessToken,
            'refresh_token' => $this->resource->refreshToken,
            'expires_at' => $this->resource->expiresAt
        ];
    }
}
