<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Marketing\Models\Post;
use App\Domains\Marketing\Models\PostCategory;
use App\Domains\Marketing\Services\PostService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class BlogController extends Controller
{
    public function __construct(private readonly PostService $postService) {}

    public function index(Request $request): Response
    {
        $posts = Post::with(['author:id,name', 'category:id,name'])
            ->when($request->string('status')->isNotEmpty(), fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->string('q')->isNotEmpty(), fn ($q) => $q->where('title', 'like', '%' . $request->string('q') . '%'))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Admin/Blog/Index', [
            'posts'   => $posts,
            'filters' => $request->only(['status', 'q']),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Admin/Blog/Form', [
            'categories' => PostCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'post'       => null,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'slug'             => ['nullable', 'string', 'max:255', 'unique:posts,slug'],
            'post_category_id' => ['nullable', 'integer', 'exists:post_categories,id'],
            'excerpt'          => ['nullable', 'string', 'max:500'],
            'content'          => ['required', 'string'],
            'status'           => ['required', 'in:draft,published'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'cover_image'      => ['nullable', 'image', 'max:4096'],
        ]);

        $data['author_id'] = $request->user()->id;

        $this->postService->create($data, $request->file('cover_image'));

        return redirect()->route('admin.posts.index')->with('success', 'Post criado com sucesso!');
    }

    public function edit(Post $post): Response
    {
        return Inertia::render('Admin/Blog/Form', [
            'categories' => PostCategory::where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'post'       => $post->load('category'),
        ]);
    }

    public function update(Request $request, Post $post): RedirectResponse
    {
        $data = $request->validate([
            'title'            => ['required', 'string', 'max:255'],
            'slug'             => ['nullable', 'string', 'max:255', "unique:posts,slug,{$post->id}"],
            'post_category_id' => ['nullable', 'integer', 'exists:post_categories,id'],
            'excerpt'          => ['nullable', 'string', 'max:500'],
            'content'          => ['required', 'string'],
            'status'           => ['required', 'in:draft,published'],
            'meta_title'       => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'cover_image'      => ['nullable', 'image', 'max:4096'],
        ]);

        $this->postService->update($post, $data, $request->file('cover_image'));

        return redirect()->route('admin.posts.index')->with('success', 'Post atualizado com sucesso!');
    }

    public function destroy(Post $post): RedirectResponse
    {
        $this->postService->delete($post);

        return redirect()->route('admin.posts.index')->with('success', 'Post removido.');
    }
}
