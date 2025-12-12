<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\Api\MovieController;
use App\Http\Controllers\Api\TimecodeController;
use App\Http\Controllers\Api\TwitchController;
use App\Http\Middleware\AuthApiMiddleware;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    Route::get('/auth', [AuthController::class, 'extension']);
    Route::prefix('twitch')->middleware(AuthApiMiddleware::class)->controller(TwitchController::class)->group(function () {
        Route::get('/stream/status', 'streamStatus');
        Route::middleware(AuthApiMiddleware::class)->group(function () {
            Route::post('/token', 'token');
        });
    });
    Route::prefix('movie')->controller(MovieController::class)->group(function () {
        Route::get('/search', 'search');
        Route::get('/check', 'check');
    });
    Route::prefix('timecode')->controller(TimecodeController::class)->group(function () {
        Route::get('/search', 'search');
        Route::middleware(AuthApiMiddleware::class)->group(function () {
            Route::post('/new', 'new');
            Route::get('/editor/{movieId}', 'editor');

            Route::prefix('{timecodeId}')->group(function () {
                Route::post('/edit', 'edit');
                Route::delete('/', 'deleteTimecode');
            });
        });
        Route::post('/{timecodeId}/analytics/used', 'usedAnalytics');
        Route::get('/{timecodeId}/segment', 'segment');
    });
});
