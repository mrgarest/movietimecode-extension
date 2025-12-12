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
        Schema::create('movie_tсs', function (Blueprint $table) {
            $table->id()->from(1000);
            $table->foreignIdFor(User::class)->nullable()->constrained()->nullOnDelete();
            $table->foreignIdFor(Movie::class)->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('duration')->nullable();
            $table->unsignedBigInteger('like_count')->default(0);
            $table->unsignedBigInteger('dislike_count')->default(0);
            $table->unsignedBigInteger('used_count')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_timecode_opts');
    }
};
