<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attachments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('application_id');
            $table->string('type', 50);
            $table->string('filename', 255);
            $table->string('path', 255);
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('application_id')->references('id')->on('applications');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attachments');
    }
};
