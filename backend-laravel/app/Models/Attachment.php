<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Attachment extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'application_id',
        'type',
        'filename',
        'path',
        'created_at',
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}
