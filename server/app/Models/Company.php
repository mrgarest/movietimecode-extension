<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    protected $fillable = [
        'name',
        'country',
        'created_at',
        'updated_at',
    ];

    protected $casts = [
        'name' => 'string',
        'country' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
