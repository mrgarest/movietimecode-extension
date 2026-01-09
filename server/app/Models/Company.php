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

    public static function fromCache(array $attributes): self
    {
        $instance = new static;
        $instance->setRawAttributes($attributes, true);
        $instance->exists = true;
        return $instance;
    }

    public function toCache(): array
    {
        return $this->getRawOriginal();
    }
}
