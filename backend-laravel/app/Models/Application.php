<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Application extends Model
{
    protected $fillable = [
        'application_no',
        'applicant_id',
        'unit_id',
        'rhq_id',
        'regiment_name',
        'unit_no',
        'academic_year',
        'status',
        'current_stage',
        'cc_approved',
        'gso1_approved',
        'form_a_json',
        'form_b_json',
    ];

    protected $casts = [
        'cc_approved' => 'boolean',
        'gso1_approved' => 'boolean',
        'form_a_json' => 'array',
        'form_b_json' => 'array',
    ];

    public function applicant()
    {
        return $this->belongsTo(User::class, 'applicant_id');
    }
}
