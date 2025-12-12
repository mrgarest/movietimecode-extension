<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class ExpansionAuth extends Model
{
    protected $fillable = [
        'user_id',
        'token',
        'payload',
        'expires_at',
        'created_at',
        'updated_at'
    ];

    protected $casts = [
        'payload' => 'array',
        'expires_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUserId(Builder $query, $id): Builder
    {
        return $query->where('user_id', $id);
    }

    public function scopeToken(Builder $query, $token): Builder
    {
        return $query->where('token', $token);
    }
}
