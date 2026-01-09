<?php

namespace App\DTO\Twitch;

readonly class StreamStatusData
{
    public function __construct(
        public string $id,
        public string $userId,
        public string $username,
        public string $type,
        public string $title,
        public string $language,
        public string $gameId,
        public string $gameName,
        public bool $isLive,
    ) {}

    public static function fromTwitch(array $data): self
    {
        return new self(
            id: $data['id'],
            userId: $data['user_id'],
            username: $data['user_login'],
            type: $data['type'],
            title: $data['title'],
            language: $data['language'],
            gameId: $data['game_id'],
            gameName: $data['game_name'],
            isLive: $data['type'] === 'live'
        );
    }
}
