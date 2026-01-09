<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SuccessResource;
use App\Http\Resources\Twitch\TwitchTokenResource;
use App\Services\TwitchService;
use Illuminate\Http\Request;

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
        $validated = $request->validate([
            'username' => 'required|string',
            'access_token' => 'required|string',
        ]);

        $data = $this->twitchService->stream(
            accessToken: $validated['access_token'],
            username: $validated['username']
        );

        return new SuccessResource([
            'is_live' => $data ? $data->isLive : false
        ]);
    }
}
