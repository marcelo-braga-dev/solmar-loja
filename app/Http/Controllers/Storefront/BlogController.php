<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Marketing\Models\Post;
use App\Domains\Marketing\Models\PostCategory;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $posts = Post::published()
            ->with(['author:id,name', 'category:id,name,slug'])
            ->when($request->string('category')->isNotEmpty(), fn ($q) => $q->whereHas(
                'category',
                fn ($q2) => $q2->where('slug', $request->string('category')->value()),
            ))
            ->when($request->string('q')->isNotEmpty(), fn ($q) => $q->where(
                fn ($q2) => $q2->where('title', 'like', '%' . $request->string('q') . '%')
                    ->orWhere('excerpt', 'like', '%' . $request->string('q') . '%'),
            ))
            ->orderByDesc('published_at')
            ->paginate(12)
            ->withQueryString()
            ->through(fn (Post $post) => array_merge($post->toArray(), [
                'reading_time' => $post->readingTime(),
            ]));

        $categories = PostCategory::where('is_active', true)
            ->withCount(['posts' => fn ($q) => $q->published()])
            ->having('posts_count', '>', 0)
            ->orderBy('name')
            ->get(['id', 'name', 'slug']);

        return Inertia::render('Storefront/Blog/Index', [
            'posts'      => $posts,
            'categories' => $categories,
            'filters'    => $request->only(['category', 'q']),
        ]);
    }

    public function show(string $slug): Response
    {
        $post = Post::published()
            ->with(['author:id,name', 'category:id,name,slug'])
            ->where('slug', $slug)
            ->firstOrFail();

        $related = Post::published()
            ->where('id', '!=', $post->id)
            ->when($post->post_category_id, fn ($q) => $q->where('post_category_id', $post->post_category_id))
            ->with('author:id,name')
            ->orderByDesc('published_at')
            ->limit(3)
            ->get(['id', 'title', 'slug', 'excerpt', 'cover_image', 'published_at', 'author_id']);

        return Inertia::render('Storefront/Blog/Post', [
            'post'    => array_merge($post->toArray(), ['reading_time' => $post->readingTime()]),
            'related' => $related,
        ]);
    }
}
