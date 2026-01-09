<?php

namespace App\DTO\Timecode;

use App\Models\MovieTimecode;

class TimecodeAuthorData
{
    public function __construct(
        public int $timecodeId,
        public int $userId,
        public string $username,
        public int $duration,
        public int $like_count,
        public int $dislike_count,
        public int $used_count,
        public int $segment_count,
    ) {}

    public static function fromModel(MovieTimecode $timecode): self
    {
        return new self(
            timecodeId: $timecode->id,
            userId: $timecode->user->id,
            username: $timecode->user->username,
            duration: (int) $timecode->duration,
            like_count: (int) $timecode->like_count,
            dislike_count: (int) $timecode->dislike_count,
            used_count: (int) $timecode->used_count,
            segment_count: (int) ($timecode->segments_count ?? 0)
        );
    }

    public static function fromArray(array $data): self
    {
        return new self(
            userId: $data['user']['id'],
            username: $data['user']['username'],
            timecodeId: $data['timecode']['id'],
            duration: $data['timecode']['duration'],
            like_count: $data['timecode']['like_count'],
            dislike_count: $data['timecode']['dislike_count'],
            used_count: $data['timecode']['used_count'],
            segment_count: $data['timecode']['segment_count']
        );
    }


    public function toArray(): array
    {
        return [
            'user' => [
                'id' => $this->userId,
                'username' => $this->username,
            ],
            'timecode' => [
                'id' => $this->timecodeId,
                'duration' => $this->duration,
                'like_count' => $this->like_count,
                'dislike_count' => $this->dislike_count,
                'used_count' => $this->used_count,
                'segment_count' => $this->segment_count,
            ],
        ];
    }
}
