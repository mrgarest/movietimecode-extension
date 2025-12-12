<?php

namespace App\Services;

use App\Clients\ImdbClient;
use Illuminate\Support\Str;

class ImdbService
{
    public static function info($id)
    {
        $data = ImdbClient::info($id);
        if ($data == null) return null;

        return [
            'rating' => static::getRating($data),
            // 'mpa' => static::getMPA($data),
            'distributors' => static::getDistributors($data),
        ];
    }

    private static function getRating($data)
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

    private static function getDistributors($data)
    {
        preg_match('@"sub-section-distribution".+?><ul.+?>(.+?)</ul></div></section>@m', $data, $str);

        if (!isset($str[1])) return null;

        preg_match_all('@<li.+?class="ipc-metadata-list-item__label.+?>(.+?)</a>.+?div.+?ipc-metadata-list-item__content-container">(.+?)</div><a.+?</li>@m', $str[1], $matches);

        $list = $matches[1] ?? null;
        if (!$list) return null;

        $replace = [
            [
                ['twentieth century fox', '20th Century Fox'],
                '20th Century Fox'
            ],
            [
                ['Universal Pictures', 'Universal Studios'],
                'Universal Pictures'
            ],
            [
                ['Warner Bros', 'Warner'],
                'Warner Bros.'
            ],
            [
                ['Paramount'],
                'Paramount'
            ],
            [
                ['disney'],
                'Disney'
            ],
            [
                ['Sony Pictures'],
                'Sony Pictures'
            ],
            [
                ['Columbia TriStar Films'],
                'Columbia TriStar Films'
            ]
        ];

        $distributors = [];
        foreach ($list as $key => $item) {
            $replaced = false;
            $dop = $matches[2][$key] ?? null;

            if (!Str::contains($dop, 'theatrical')) continue;
            if (!Str::contains($dop, [
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
            ])) continue;

            $normalizedItem = mb_strtolower(trim(html_entity_decode($item, ENT_QUOTES | ENT_HTML5, 'UTF-8')));
            foreach ($replace as $replacement) {
                foreach ($replacement[0] as $word) {
                    if (Str::contains($normalizedItem, mb_strtolower($word))) {
                        $distributors[] = $replacement[1];
                        $replaced = true;
                        break 2;
                    }
                }
            }

            if (!$replaced) {
                $distributors[] = $item;
            }
        }

        $distributors = array_values(array_unique($distributors));

        return $distributors;
    }

    public static function contentInfo($id)
    {
        $data = ImdbClient::contentInfo($id);
        if ($data == null) return null;

        $contentRating = [
            'nudity' => null,
            'violence' => null,
            'profanity' => null,
            'alcohol' => null,
            'frightening' => null
        ];
        preg_match_all('@data-testid="rating-item"(.+?)</li>@m', $data, $matches);
        if (isset($matches[1])) foreach ($matches[1] as $value) {

            if (str_contains($value, 'Sex &amp; Nudity')) $contentRating['nudity'] = static::convertContentRating($value);
            elseif (str_contains($value, 'Violence &amp; Gore')) $contentRating['violence'] = static::convertContentRating($value);
            elseif (str_contains($value, 'Profanity'))  $contentRating['profanity'] = static::convertContentRating($value);
            elseif (str_contains($value, 'Alcohol, Drugs &amp; Smoking'))  $contentRating['alcohol'] = static::convertContentRating($value);
            elseif (str_contains($value, 'Frightening &amp; Intense Scenes'))  $contentRating['frightening'] = static::convertContentRating($value);
        }

        $testids = [
            [
                'section' => 'sub-section-nudity',
                'key' => 'nudity',
            ],
            [
                'section' => 'sub-section-violence',
                'key' => 'violence',
            ],
            [
                'section' => 'sub-section-profanity',
                'key' => 'profanity',
            ],
            [
                'section' => 'sub-section-alcohol',
                'key' => 'alcohol',
            ],
            [
                'section' => 'sub-section-frightening',
                'key' => 'frightening',
            ]
        ];
        $gides = [];
        foreach ($testids as $testid) {
            preg_match('@data-testid="' . $testid['section'] . '".+?>(.+?)</section>@m', $data, $sectionMatches);
            if (!isset($sectionMatches[1])) continue;

            preg_match_all('@class="ipc-html-content-inner-div".+?>(.+?)</div>@m', $sectionMatches[1], $matches);
            if (!isset($matches[1])) continue;

            foreach ($matches[1] as $text) {
                $text = trim($text);
                if ($text == '(none)') continue;
                $gides[$testid['key']][] = trim($text);
            }
        }
        return [
            'rating' => $contentRating,
            'gides' => $gides
        ];
    }

    private static function convertContentRating($data)
    {
        foreach (
            [
                [
                    'name' => 'None',
                    'value' => 0,
                ],
                [
                    'name' => 'Mild',
                    'value' => 1,
                ],
                [
                    'name' => 'Moderate',
                    'value' => 2,
                ],
                [
                    'name' => 'Severe',
                    'value' => 3,
                ]
            ] as $value
        ) {
            if (str_contains($data, $value['name'])) return $value['value'];
        }
        return null;
    }
}
