<?php

namespace App\DTO\Auth;

readonly class CallbackAuthData
{
    public function __construct(
        public bool $success,
        public ?string $target = null,
        public ?int $id = null,
        public ?int $token = null,
        public ?string $langKey = null,
    ) {}

    public function toArray(): array
    {
        return [
            'success' => $this->success,
            'target' => $this->target,
            'id' => $this->id,
            'token' => $this->token,
            'lang_key' => $this->langKey,
        ];
    }
}
