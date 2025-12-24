<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Storage;

class DeleteFileJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Create a new job instance.
     */
    public function __construct(
        public string $disk,
        public string $path
    ) {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        if (Storage::disk($this->disk)->exists($this->path)) {
            Storage::disk($this->disk)->delete($this->path);
        }
    }
}
