<?php

namespace App\Notifications;

use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use NotificationChannels\Telegram\Enums\ParseMode;
use NotificationChannels\Telegram\TelegramMessage;

class AddedTimecodeNotifi extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        public $userId,
        public string $username,
        public $movieId,
        public string $movieTitle,
        public $segmentsCount,
        public Carbon $createdAt,
    ) {
        //
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['telegram'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toTelegram(object $notifiable): TelegramMessage
    {
        return TelegramMessage::create()
            ->parseMode(ParseMode::HTML) 
            ->line('🎞 <b>Додано нові таймкоди</b>')
            ->line("Користувач: {$this->username} ($this->userId)")
            ->line("Фільм: {$this->movieTitle} ($this->movieId)")
            ->line('Кількість сегментів: ' . $this->segmentsCount)
            ->line('Дата додавання: ' . $this->createdAt->format("Y-m-d H:i:s") . ' UTC');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
