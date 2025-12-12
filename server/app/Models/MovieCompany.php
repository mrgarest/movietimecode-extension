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

    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
