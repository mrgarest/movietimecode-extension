<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::get('/login/twitch', 'logIn');
    Route::get('/callback/twitch', 'callback');
});

Route::get('/{path?}', [AppController::class, 'index']);
