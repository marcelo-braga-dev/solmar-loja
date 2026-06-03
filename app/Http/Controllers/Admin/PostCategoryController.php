<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Marketing\Models\PostCategory;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Str;

final class PostCategoryController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Blog/Categories', [
            'categories' => PostCategory::withCount('posts')->orderBy('name')->get(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'slug'        => ['nullable', 'string', 'max:120', 'unique:post_categories,slug'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active'   => ['boolean'],
        ]);

        $data['slug'] ??= Str::slug($data['name']);

        PostCategory::create($data);

        return back()->with('success', 'Categoria criada.');
    }

    public function update(Request $request, PostCategory $postCategory): RedirectResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active'   => ['boolean'],
        ]);

        $postCategory->update($data);

        return back()->with('success', 'Categoria atualizada.');
    }

    public function destroy(PostCategory $postCategory): RedirectResponse
    {
        if ($postCategory->posts()->exists()) {
            return back()->withErrors(['category' => 'Não é possível excluir uma categoria com posts vinculados.']);
        }

        $postCategory->delete();

        return back()->with('success', 'Categoria removida.');
    }
}
