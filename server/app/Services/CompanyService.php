<?php

namespace App\Services;

use App\Cache\CompanyCacheKey;
use App\DTO\Movie\MovieCompanData;
use App\Enums\MovieCompanyRole;
use App\Models\Company;
use App\Models\Movie;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class CompanyService
{
    /**
     * Get the existing company or create a new one using caching.
     *
     * @param string $name Company name
     * @param string|null $countryCode.
     * @return Company
     */
    public function getOrCreateCompany(string $name, ?string $countryCode = null): Company
    {
        $name = trim($name);
        return Company::fromCache(Cache::remember(CompanyCacheKey::name($name), Carbon::now()->addMinutes(10), function () use ($name, $countryCode) {
            return Company::firstOrCreate(
                ['name' => $name],
                ['country' => $countryCode ? strtolower($countryCode) : null]
            )->toCache();
        }));
    }

    /**
     * Forms a data array for linking the film to the company and its role.
     *
     * @param Movie $movie
     * @param Company $company
     * @param MovieCompanyRole
     * @return array
     */
    public function movieCompanyInsert(Movie $movie, Company $company, MovieCompanyRole $role): array
    {
        $now = Carbon::now();
        return [
            'movie_id' => $movie->id,
            'company_id' => $company->id,
            'role_id' => $role->value,
            'created_at' => $now,
            'updated_at' => $now
        ];
    }

    /**
     * Get companies for the movie.
     * 
     * @param Movie $movie
     * @return Collection
     */
    public function getForMovie(Movie $movie): Collection
    {
        $cacheKey = CompanyCacheKey::forMovie($movie->id);

        if ($companies = Cache::get($cacheKey)) {
            return collect($companies)->map(fn($item) => MovieCompanData::fromArray($item));
        }

        // Loading connections: intermediate table + the company itself
        $movie->loadMissing('companies.company');

        $companies = $movie->companies->map(fn($movieCompany) => MovieCompanData::fromModel($movieCompany));

        Cache::put($cacheKey, $companies->map->toArray()->all(), Carbon::now()->addMinutes(5));

        return $companies;
    }
}
