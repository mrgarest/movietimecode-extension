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
        Schema::create('movie_external_ids', function (Blueprint $table) {
            $table->id()->from(1000);
            $table->foreignIdFor(Movie::class)->constrained()->cascadeOnDelete();
            $table->bigInteger('external_id');
            $table->string('value');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('movie_external_ids');
    }
};
