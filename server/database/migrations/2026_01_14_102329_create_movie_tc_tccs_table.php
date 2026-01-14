<?php

use App\Models\Movie;
use App\Models\MovieTimecode;
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
        // MovieTimecodeTwitchContentClassification
        Schema::create('movie_tc_tccs', function (Blueprint $table) {
            $table->id()->from(1000);
            $table->foreignIdFor(User::class)->nullable()->constrained()->nullOnDelete();
            $table->foreignIdFor(Movie::class)->constrained()->cascadeOnDelete();
            $table->foreignIdFor(MovieTimecode::class, 'timecode_id')->constrained('movie_tcs')->cascadeOnDelete();
            $table->unsignedSmallInteger('value');
            $table->timestamps();

            $table->unique(['timecode_id', 'value']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_tc_tccs');
    }
};
