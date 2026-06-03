<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Services;

use App\Domains\Marketing\Models\NewsletterSubscriber;
use App\Mail\NewsletterConfirmation;
use Illuminate\Support\Facades\Mail;

final class NewsletterService
{
    public function subscribe(string $email, ?string $name = null): NewsletterSubscriber
    {
        $subscriber = NewsletterSubscriber::firstOrCreate(
            ['email' => $email],
            ['name' => $name],
        );

        if (! $subscriber->confirmed) {
            Mail::to($email)->queue(new NewsletterConfirmation($subscriber));
        }

        return $subscriber;
    }

    public function confirm(string $token): bool
    {
        $subscriber = NewsletterSubscriber::where('token', $token)
            ->where('confirmed', false)
            ->first();

        if (! $subscriber) {
            return false;
        }

        $subscriber->update([
            'confirmed'       => true,
            'confirmed_at'    => now(),
            'unsubscribed_at' => null,
        ]);

        return true;
    }

    public function unsubscribe(string $token): bool
    {
        $subscriber = NewsletterSubscriber::where('token', $token)->first();

        if (! $subscriber) {
            return false;
        }

        $subscriber->update(['unsubscribed_at' => now()]);

        return true;
    }
}
