<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;

class ExtensionAuthResource extends SuccessResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->id,
            'role_id' => $this->resource->role_id,
            'username' => $this->resource->username,
            'picture' => $this->resource->picture,
            'twitch' => $this->resource->twitch ? [
                'access_token' => $this->resource->twitch->accessToken,
                'refresh_token' => $this->resource->twitch->refreshToken,
                'expires_at' => $this->resource->twitch->expiresAt,
            ] : null,
            'access_token' => $this->resource->accessToken,
            'expires_at' => $this->resource->expiresAt,
        ];
    }
}
