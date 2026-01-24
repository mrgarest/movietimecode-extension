<?php

namespace App\Console\Commands;

use App\Enums\MovieExternalId as EnumsMovieExternalId;
use App\Models\MovieExternalId;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Spatie\Sitemap\Sitemap;
use Spatie\Sitemap\Tags\Url;

class GenerateSitemap extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'sitemap:generate';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sitemap generation';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $sitemap = Sitemap::create();

        // Static Pages
        $sitemap->add(Url::create('/')
            ->setPriority(1.0)
            ->setChangeFrequency(Url::CHANGE_FREQUENCY_DAILY));

        // Movies with timecodes
        MovieExternalId::query()
            ->join('movies', 'movie_external_ids.movie_id', '=', 'movies.id')
            ->whereHas('movie.timecodes')
            ->where('movie_external_ids.external_id', EnumsMovieExternalId::TMDB->value)
            ->orderByDesc('movies.created_at')
            ->select([
                'movie_external_ids.value',
                'movies.updated_at as movie_updated_at'
            ])
            ->limit(10000)
            ->chunk(100, function ($externalIds) use ($sitemap) {
                foreach ($externalIds as $externalId) {
                    $sitemap->add(
                        Url::create("/movies/{$externalId->value}")
                            ->setLastModificationDate(Carbon::parse($externalId->movie_updated_at))
                            ->setPriority(0.7)
                            ->setChangeFrequency(Url::CHANGE_FREQUENCY_MONTHLY)
                    );
                }
            });

        // Save the file
        $sitemap->writeToFile(public_path('sitemap.xml'));
        $this->info('Sitemap generated successfully!');
    }
}
