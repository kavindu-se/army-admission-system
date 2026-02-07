<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->string('application_no', 50)->unique();
            $table->unsignedBigInteger('applicant_id');
            $table->unsignedBigInteger('unit_id');
            $table->unsignedBigInteger('rhq_id');
            $table->string('regiment_name', 100)->nullable();
            $table->string('unit_no', 50)->nullable();
            $table->string('academic_year', 10);
            $table->string('status', 30);
            $table->string('current_stage', 30);
            $table->boolean('cc_approved')->default(false);
            $table->boolean('gso1_approved')->default(false);
            $table->json('form_a_json');
            $table->json('form_b_json');
            $table->timestamps();

            $table->foreign('applicant_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('applications');
    }
};
