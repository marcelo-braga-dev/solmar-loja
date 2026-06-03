<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Services;

use App\Domains\Marketing\Models\Post;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

final class PostService
{
    public function create(array $data, ?UploadedFile $cover = null): Post
    {
        if (! isset($data['slug']) || $data['slug'] === '') {
            $data['slug'] = $this->uniqueSlug($data['title']);
        }

        if ($cover) {
            $data['cover_image'] = $cover->store('posts', 'public');
        }

        if (($data['status'] ?? 'draft') === 'published' && ! isset($data['published_at'])) {
            $data['published_at'] = now();
        }

        return Post::create($data);
    }

    public function update(Post $post, array $data, ?UploadedFile $cover = null): Post
    {
        if ($cover) {
            if ($post->cover_image) {
                Storage::disk('public')->delete($post->cover_image);
            }
            $data['cover_image'] = $cover->store('posts', 'public');
        }

        if (
            ($data['status'] ?? $post->status) === 'published'
            && $post->status === 'draft'
            && ! isset($data['published_at'])
        ) {
            $data['published_at'] = now();
        }

        $post->update($data);

        return $post->fresh();
    }

    public function delete(Post $post): void
    {
        if ($post->cover_image) {
            Storage::disk('public')->delete($post->cover_image);
        }

        $post->delete();
    }

    private function uniqueSlug(string $title): string
    {
        $slug  = Str::slug($title);
        $count = Post::where('slug', 'like', "{$slug}%")->count();

        return $count > 0 ? "{$slug}-{$count}" : $slug;
    }
}
