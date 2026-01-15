<?php

namespace App\Http\Controllers\Api;

use App\Enums\TwitchContentClassification;
use App\Http\Controllers\Controller;
use App\Http\Resources\SuccessResource;
use App\Http\Resources\Twitch\TwitchTokenResource;
use App\Services\TwitchService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;

class TwitchController extends Controller
{
    public function __construct(
        protected TwitchService $twitchService
    ) {}

    /**
     * Get a new access token from Twitch.
     */
    public function token(Request $request)
    {
        $validated = $request->validate([
            'grant_type' => 'required|in:refresh_token',
            'refresh_token' => 'required|string'
        ]);

        return new TwitchTokenResource($this->twitchService->token($validated['refresh_token']));
    }

    /**
     * Checks whether the stream is live on Twitch.
     */
    public function streamStatus(Request $request)
    {
        $validated = $request->validate(['access_token' => 'required|string']);

        $data = $this->twitchService->stream(
            accessToken: $validated['access_token'],
            user: $request->user()
        );

        return new SuccessResource([
            'is_live' => $data ? $data->isLive : false
        ]);
    }

    /**
     * Updates content classification tags for the user's Twitch channel.
     */
    public function contentClassification(Request $request)
    {
        $validated = $request->validate([
            'access_token' => 'required|string',
            'enabled' => 'required|boolean',
            'ids' => 'required|array',
            'ids.*' => [new Enum(TwitchContentClassification::class)]
        ]);

        $this->twitchService->updateContentClassification(
            accessToken: $validated['access_token'],
            user: $request->user(),
            ids: $validated['ids'],
            enabled: $validated['enabled']
        );

        return new SuccessResource(null);
    }
}
