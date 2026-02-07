<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id');
            $table->string('level', 30);
            $table->unsignedBigInteger('actor_id');
            $table->string('action', 20);
            $table->string('comment', 255)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('application_id')->references('id')->on('applications');
            $table->foreign('actor_id')->references('id')->on('users');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
