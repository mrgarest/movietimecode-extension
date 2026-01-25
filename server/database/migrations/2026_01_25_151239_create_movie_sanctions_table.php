<?php

use App\Models\Movie;
use App\Models\User;
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
        Schema::create('movie_sanctions', function (Blueprint $table) {
            $table->id()->from(100);
            $table->foreignIdFor(Movie::class)->constrained()->cascadeOnDelete();

            // Who reported it
            $table->string('device_token', 64);

            // Who was blocked
            $table->string('username', 60);

            // Sanctions data
            $table->unsignedSmallInteger('type');
            $table->unsignedSmallInteger('reason')->nullable();
            $table->string('comment')->nullable();
            $table->string('file_name')->nullable();
            $table->date('occurred_at')->nullable();

            // Moderation
            $table->timestamp('approved_at')->nullable();
            $table->foreignIdFor(User::class, 'approved_by')->nullable()->constrained()->nullOnDelete();

            $table->timestamps();

            // One report per movie from one device
            $table->index(['movie_id', 'username']);
            $table->index(['movie_id', 'approved_at', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_sanctions');
    }
};
