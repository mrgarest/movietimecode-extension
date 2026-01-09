<?php

namespace App\Services\IMDB;

use App\Clients\ImdbClient;
use App\DTO\IMDB\ImdbInfoData;
use Illuminate\Support\Str;

class ImdbParserService
{
    public function __construct(
        protected ImdbClient $client
    ) {}

    /**
     * Get information about the movie from IMDB.
     *
     * @param int|string $id
     * 
     * @return ImdbInfoData|null
     */
    public function info(int|string $id): ImdbInfoData
    {
        $data = $this->client->info($id);
        if (!$data) return new ImdbInfoData();

        return new ImdbInfoData(
            rating: $this->getRating($data),
            distributors: $this->getDistributors($data)
        );
    }

    /**
     * Get a movie rating.
     *
     * @param string $data Response data from the client
     * 
     * @return float|null
     */
    private function getRating(string $data): ?float
    {
        preg_match('@ipc-rating-star--rating">([0-9.]+)</span>@m', $data, $matches);

        if (!isset($matches[1])) return null;
        $value = str_replace(',', '.', $matches[1]);

        return is_numeric($value) ? (float) $value : null;
    }

    // private static function getMPA($data)
    // {
    //     return null;
    //     preg_match('~<li class="ipl-inline-list__item">(?:\s+)(TV-Y|TV-Y7|TV-Y7-FV|TV-G|TV-PG|TV-14|TV-MA|TV-MA-L|TV-MA-S|TV-MA-V|G|PG|PG-13|R|NC-17|NR|UR|M|X)(?:\s+)<\/li>~Uim', $data, $matches);

    //     return isset($matches[1]) ? $matches[1] : null;
    // }

    /**
     * Get distributors.
     *
     * @param string $data Response data from the client
     * 
     * @return array|null
     */
    private function getDistributors(string $data): ?array
    {
        // Pull out the distribution section
        if (!preg_match('@"sub-section-distribution".+?><ul.+?>(.+?)</ul></div></section>@s', $data, $section)) {
            return null;
        }

        // Extract all elements of the list
        preg_match_all('@<li.+?class="ipc-metadata-list-item__label.+?>(.+?)</a>.+?div.+?ipc-metadata-list-item__content-container">(.+?)</div>@s', $section[1], $matches);

        if (empty($matches[1])) {
            return null;
        }

        // Replacement dictionary (Search key => Reference name)
        $mapping = [
            'twentieth century fox' => '20th Century Fox',
            '20th century fox' => '20th Century Fox',
            'universal pictures' => 'Universal Pictures',
            'universal studios' => 'Universal Pictures',
            'warner' => 'Warner Bros.',
            'paramount' => 'Paramount',
            'disney' => 'Disney',
            'sony pictures' => 'Sony Pictures',
            'columbia tristar' => 'Columbia TriStar Films',
        ];

        $allowedRegions = [
            'World-wide',
            'Ukraine',
            'United States',
            'Canada',
            'United Kingdom',
            'Germany',
            'Ireland',
            'Spain',
            'France',
            'Finland',
            'Italy',
            'Hong Kong',
            'Brazil',
            'South Korea',
            'Australia',
            'Netherlands',
            'Japan',
            'Portugal',
            'Poland',
            'United Arab Emirates'
        ];

        return collect($matches[1])
            ->map(function ($name, $index) use ($matches, $allowedRegions, $mapping) {
                $metadata = $matches[2][$index] ?? '';

                // Filter by rental type and region
                if (!Str::contains($metadata, 'theatrical') || !Str::contains($metadata, $allowedRegions)) {
                    return null;
                }

                $cleanName = trim(html_entity_decode($name, ENT_QUOTES | ENT_HTML5, 'UTF-8'));
                $lowerName = mb_strtolower($cleanName);

                // Searching for a match in the dictionary
                foreach ($mapping as $search => $replacement) {
                    if (str_contains($lowerName, $search)) {
                        return $replacement;
                    }
                }

                return $cleanName;
            })
            ->filter()
            ->unique()
            ->values()
            ->toArray();
    }

    public function contentInfo($id): ?array
    {
        $data = $this->client->contentInfo($id);
        if (!$data) return null;

        // Mapping IMDb text tags to keys in our array
        $ratingMap = [
            'Sex &amp; Nudity' => 'nudity',
            'Violence &amp; Gore' => 'violence',
            'Profanity' => 'profanity',
            'Alcohol, Drugs &amp; Smoking' => 'alcohol',
            'Frightening &amp; Intense Scenes' => 'frightening',
        ];

        $contentRating = array_fill_keys(array_values($ratingMap), null);

        // Parsing rating levels (Mild, Moderate, etc.)
        preg_match_all('@data-testid="rating-item"(.+?)</li>@s', $data, $matches);

        foreach ($matches[1] ?? [] as $itemHtml) {
            foreach ($ratingMap as $label => $key) {
                if (str_contains($itemHtml, $label)) {
                    $contentRating[$key] = $this->convertContentRating($itemHtml);
                    break;
                }
            }
        }

        // Parsing detailed descriptions (guides)
        $guides = [];
        foreach ($ratingMap as $label => $key) {
            $sectionId = "sub-section-{$key}";

            // Find the section block
            if (preg_match('@data-testid="' . $sectionId . '".+?>(.+?)</section>@s', $data, $section)) {
                // Extract all text descriptions in this section
                preg_match_all('@class="ipc-html-content-inner-div".+?>(.+?)</div>@s', $section[1], $guideMatches);

                $guides[$key] = collect($guideMatches[1] ?? [])
                    ->map(fn($text) => trim(html_entity_decode($text)))
                    ->filter(fn($text) => $text !== '' && $text !== '(none)')
                    ->values()
                    ->toArray();
            }
        }

        return [
            'rating' => $contentRating,
            'gides' => array_filter($guides)
        ];
    }

    private function convertContentRating(string $html): ?int
    {
        $levels = [
            'None' => 0,
            'Mild' => 1,
            'Moderate' => 2,
            'Severe' => 3,
        ];

        foreach ($levels as $name => $value) {
            if (str_contains($html, $name)) return $value;
        }

        return null;
    }
}
