<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Domains\Orders\Events\OrderPlaced;
use App\Models\User;
use App\Notifications\NewOrderNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

final class NotifyAdminsOnNewOrder implements ShouldQueue
{
    public function handle(OrderPlaced $event): void
    {
        $admins = User::role(['admin', 'manager'])->get();

        foreach ($admins as $admin) {
            $admin->notify(new NewOrderNotification($event->order));
        }
    }
}
