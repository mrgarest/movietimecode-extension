<?php

namespace App\Helpers;

use Illuminate\Http\Request;

class RequestManager
{
    /**
     * Get the client's IP address from the request, considering Cloudflare headers.
     *
     * @param Request $request
     * 
     * @return string The client's IP address, considering Cloudflare headers if available, otherwise falling back to the default IP address from the request.
     */
    public static function getIp(Request $request)
    {
        $CF_ConnectingIp = $request->header('CF-Connecting-IP');
        return $CF_ConnectingIp !== null ? $CF_ConnectingIp : $request->ip();
    }
}
