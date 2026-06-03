<?php

declare(strict_types=1);

use App\Domains\Marketing\Models\Post;

describe('Post', function (): void {
    it('isPublished returns false for draft', function (): void {
        $post = new Post();
        $post->setRawAttributes([
            'title'        => 'Test post',
            'slug'         => 'test-post',
            'content'      => 'Hello world',
            'status'       => 'draft',
            'published_at' => null,
        ]);

        expect($post->isPublished())->toBeFalse();
    });

    it('isPublished returns false when published_at is future', function (): void {
        $post = new Post();
        $post->setRawAttributes([
            'title'        => 'Test post',
            'slug'         => 'test-post',
            'content'      => 'Hello world',
            'status'       => 'published',
            'published_at' => now()->addDay()->toDateTimeString(),
        ]);

        expect($post->isPublished())->toBeFalse();
    });

    it('isPublished returns true when published and past', function (): void {
        $post = new Post();
        $post->setRawAttributes([
            'title'        => 'Test post',
            'slug'         => 'test-post',
            'content'      => 'Hello world',
            'status'       => 'published',
            'published_at' => now()->subHour()->toDateTimeString(),
        ]);

        expect($post->isPublished())->toBeTrue();
    });

    it('calculates reading time correctly', function (): void {
        $words   = str_repeat('word ', 400);
        $post    = new Post();
        $post->setRawAttributes([
            'title'        => 'Test',
            'slug'         => 'test',
            'content'      => $words,
            'status'       => 'draft',
            'published_at' => null,
        ]);

        // 400 words ÷ 200 wpm = 2 minutes
        expect($post->readingTime())->toBe(2);
    });

    it('reading time is minimum 1 minute', function (): void {
        $post = new Post();
        $post->setRawAttributes([
            'title'        => 'Test',
            'slug'         => 'test',
            'content'      => 'Short content',
            'status'       => 'draft',
            'published_at' => null,
        ]);

        expect($post->readingTime())->toBe(1);
    });
});
