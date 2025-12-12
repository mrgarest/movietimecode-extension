<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id()->from(1000);
            $table->tinyInteger('role_id');
            $table->string('username')->unique();
            $table->string('email')->unique()->nullable();
            $table->string('password')->nullable();
            $table->string('picture', 2038)->nullable();
            $table->timestamps();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('deactivated_at')->nullable();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
