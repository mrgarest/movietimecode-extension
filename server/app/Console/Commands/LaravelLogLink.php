<?php

namespace App\Console\Commands;

use App\Jobs\DeleteFileJob;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class LaravelLogLink extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'log:link {--c|clear : Clear the original log file after copying}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate temporary download link for a log file';

    protected $disk = 'public';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $logPath = storage_path('logs/laravel.log');

        if (!file_exists($logPath)) {
            $this->error("File {$logPath} does not exist.");
            return 1;
        }

        if (filesize($logPath) === 0) {
            $this->warn("Log file is empty.");
            return 0;
        }

        $tempName = 'temp/laravel_' . Carbon::now()->format('Y-m-d_Hi') . '_' . Str::random(5) . '.log';

        // Copies the log to a public directory
        $stream = fopen($logPath, 'r');
        try {
            $isSaved = Storage::disk($this->disk)->put($tempName, $stream);
            if (!$isSaved) {
                throw new \Exception("Storage disk refused to write the file.");
            }
        } catch (\Exception $e) {
            $this->error("Error during copying: " . $e->getMessage());
            return 1;
        } finally {
            if (is_resource($stream)) {
                fclose($stream);
            }
        }

        // Get the link and display it on the console
        $url = Storage::disk($this->disk)->url($tempName);
        $this->info("Temporary link: " . $url);

        // Deletes temporary file
        DeleteFileJob::dispatch($this->disk, $tempName)->delay(Carbon::now()->addMinutes(1));

        // Clearing the log when the flag is set
        if ($this->option('clear')) {
            $file = fopen($logPath, 'w');
            if ($file !== false) {
                fclose($file);
                $this->comment("Original log file has been cleared.");
            } else $this->error("Could not clear the log file.");
        }

        return 0;
    }
}
