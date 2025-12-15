<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MovieCompany extends Model
{
    protected $fillable = [
        'role_id',
        'movie_id',
        'company_id',
    ];

    protected $casts = [
        'role_id' => 'int',
        'movie_id' => 'int',
        'company_id' => 'int',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
