<?php

use App\Models\Movie;
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
        Schema::create('movies', function (Blueprint $table) {
            $table->id()->from(1000);
            $table->unsignedSmallInteger('storage_id')->nullable();
            $table->unsignedSmallInteger('duration')->nullable();
            $table->string('lang_code')->nullable();
            $table->string('title');
            $table->string('poster_path', 2083)->nullable();
            $table->string('backdrop_path', 2083)->nullable();
            $table->date('release_date');
            $table->float('rating_imdb')->nullable();
            $table->timestamps();
        });

        Schema::create('movie_translations', function (Blueprint $table) {
            $table->id()->from(1000);
            $table->foreignIdFor(Movie::class)->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('storage_id')->nullable();
            $table->string('lang_code', 5);
            $table->string('title')->nullable();
            $table->string('poster_path', 2083)->nullable();
            $table->string('backdrop_path', 2083)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movies');
    }
};
