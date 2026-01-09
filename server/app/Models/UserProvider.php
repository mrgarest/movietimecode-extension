<?php

namespace App\Models;

use App\Enums\AuthProvider;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;

class UserProvider extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'account_id',
        'name',
        'expires_at',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'user_id' => 'int',
        'provider' => 'string',
        'account_id' => 'string',
        'name' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeProvider(Builder $query, AuthProvider $provider): Builder
    {
        return $query->where('provider', $provider->value);
    }

    public function scopeAccountId(Builder $query, string $accountId): Builder
    {
        return $query->where('account_id', $accountId);
    }
}
