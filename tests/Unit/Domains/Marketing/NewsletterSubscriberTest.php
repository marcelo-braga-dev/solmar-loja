<?php

declare(strict_types=1);

use App\Domains\Marketing\Models\NewsletterSubscriber;

describe('NewsletterSubscriber', function (): void {
    it('has a token attribute in fillable', function (): void {
        $sub = new NewsletterSubscriber();

        expect($sub->getFillable())->toContain('token');
    });

    it('isActive returns false when not confirmed', function (): void {
        $sub = new NewsletterSubscriber();
        $sub->setRawAttributes([
            'email'            => 'test@example.com',
            'confirmed'        => false,
            'token'            => 'abc',
            'unsubscribed_at'  => null,
        ]);

        expect($sub->isActive())->toBeFalse();
    });

    it('isActive returns false when unsubscribed', function (): void {
        $sub = new NewsletterSubscriber();
        $sub->setRawAttributes([
            'email'            => 'test@example.com',
            'confirmed'        => true,
            'token'            => 'abc',
            'unsubscribed_at'  => now()->toDateTimeString(),
        ]);

        expect($sub->isActive())->toBeFalse();
    });

    it('isActive returns true when confirmed and not unsubscribed', function (): void {
        $sub = new NewsletterSubscriber();
        $sub->setRawAttributes([
            'email'            => 'test@example.com',
            'confirmed'        => true,
            'token'            => 'abc',
            'unsubscribed_at'  => null,
        ]);

        expect($sub->isActive())->toBeTrue();
    });
});
