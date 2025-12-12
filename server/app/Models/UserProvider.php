<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserProvider extends Model
{
    protected $fillable = [
        'user_id',
        'provider',
        'account_id',
        'name',
        'expires_at',
        'created_at',
        'updated_at'
    ];
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function findUser($provider, $accountId)
    {
        return self::where('provider', $provider)->where('account_id', $accountId);
    }
}
