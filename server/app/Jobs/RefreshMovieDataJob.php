<?php

namespace App\Jobs;

use App\Enums\RefreshMovieDataType;
use App\Services\RefreshMovieDataService;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;

class RefreshMovieDataJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        protected int $movieId,
        protected RefreshMovieDataType $type
    ) {}

    /**
     * Execute the job.
     */
    public function handle(RefreshMovieDataService $service): void
    {
        $service->refresh($this->movieId, $this->type);
    }
}
