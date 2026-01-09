<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Outdated authorization method
Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::get('/login/twitch', 'extension');
    Route::get('/callback/twitch', 'callback');
});

Route::prefix('login')->controller(AuthController::class)->group(function () {
    Route::get('/extension', 'extension');
    Route::get('/callback', 'callback');
});

// React route
Route::get('/{path?}', AppController::class);
