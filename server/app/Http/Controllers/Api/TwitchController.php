<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Clients\TwitchClient;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\Response;
use MrGarest\EchoApi\EchoApi;

class TwitchController extends Controller
{
    /**
     * Processes the receipt of a new access token from Twitch.
     */
    public function token(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'grant_type' => 'required|in:refresh_token',
            'refresh_token' => 'required|string'
        ]);

        if ($validator->fails()) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);
        $data = $validator->getData();

        $token = TwitchClient::refreshToken($data['refresh_token']);

        if (!$token) return EchoApi::httpError(Response::HTTP_INTERNAL_SERVER_ERROR);

        return EchoApi::success([
            'access_token' => $token['access_token'],
            'refresh_token' => $token['refresh_token'],
            'expires_at' => $token['expires_at']
        ]);
    }

    /**
     * Checks whether the stream is live on Twitch.
     */
    public function streamStatus(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'username' => 'required|string',
            'access_token' => 'required|string',
        ]);

        if ($validator->fails()) return EchoApi::httpError(Response::HTTP_BAD_REQUEST);
        $data = $validator->getData();

        $stream = Cache::remember('TwitchClientStream.' . md5($data['username']), Carbon::now()->addMinutes(5), function () use ($data) {
            return TwitchClient::stream($data['username'], $data['access_token']);
        });

        return EchoApi::success([
            'is_live' => $stream['is_live'] ?? false
        ]);
    }
}
