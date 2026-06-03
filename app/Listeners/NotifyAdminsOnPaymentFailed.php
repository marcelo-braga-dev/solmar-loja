<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Domains\Payments\Events\PaymentFailed;
use App\Models\User;
use App\Notifications\PaymentFailedNotification;
use Illuminate\Contracts\Queue\ShouldQueue;

final class NotifyAdminsOnPaymentFailed implements ShouldQueue
{
    public function handle(PaymentFailed $event): void
    {
        $admins = User::role(['admin', 'manager'])->get();

        foreach ($admins as $admin) {
            $admin->notify(new PaymentFailedNotification($event->payment));
        }
    }
}
