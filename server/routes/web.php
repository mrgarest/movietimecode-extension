<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Outdated authorization method
Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::get('/login/twitch', 'extension');
});

Route::controller(AuthController::class)->group(function () {
    Route::get('/login/extension', 'extension');
    Route::get('/auth/callback', 'callback');
});

// React route
Route::get('/{path?}', AppController::class);
