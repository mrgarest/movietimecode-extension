<?php

use App\Http\Controllers\AppController;
use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

// Route::get('/', [HomeController::class, 'index'])->name('home');
// Route::get('/privacy', [PrivacyController::class, 'index'])->name('privacy');

Route::prefix('auth')->controller(AuthController::class)->group(function () {
    Route::get('/login/twitch', 'logIn');
    Route::get('/callback/twitch', 'callback');
});

Route::get('/{any}', [AppController::class, 'index'])->where('any', '.*');
