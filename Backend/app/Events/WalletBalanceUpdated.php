<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WalletBalanceUpdated implements ShouldBroadcast
{
    use Dispatchable, SerializesModels;

    public $userId;
    public $balance;
    public $holds;

    public function __construct($userId, $balance, $holds)
    {
        $this->userId = $userId;
        $this->balance = $balance;
        $this->holds = $holds;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel("user.{$this->userId}.wallet"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'balance.updated';
    }
}
