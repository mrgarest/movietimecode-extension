<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Prunable;

class ExpansionAuth extends Model
{
    use Prunable;

    protected $fillable = [
        'user_id',
        'token',
        'payload',
        'expires_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'user_id' => 'int',
        'token' => 'string',
        'payload' => 'array',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    // Determine which records to consider obsolete
    public function prunable(): Builder
    {
        return static::where('expires_at', '<=', Carbon::now());
    }

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
