<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Models\Category;
use App\Domains\Settings\Models\MenuItem;
use App\Domains\Settings\Services\MenuService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class MenuItemController extends Controller
{
    public function __construct(
        private readonly MenuService $menuService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/MenuItems/Index', [
            'items' => $this->menuService->allForAdmin()->map(fn (MenuItem $item) => [
                'id'          => $item->id,
                'label'       => $item->label,
                'type'        => $item->type,
                'category_id' => $item->category_id,
                'page_key'    => $item->page_key,
                'url'         => $item->url,
                'position'    => $item->position,
                'is_active'   => $item->is_active,
                'href'        => $item->href(),
            ]),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug']),
            'pages'      => collect(MenuItem::PAGES)->map(fn (array $p, string $key) => ['key' => $key, 'label' => $p['label']])->values(),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validated($request);

        $this->menuService->create($validated);

        return back()->with('success', 'Item de menu criado com sucesso.');
    }

    public function update(Request $request, MenuItem $menuItem): RedirectResponse
    {
        $validated = $this->validated($request);

        $this->menuService->update($menuItem, $validated);

        return back()->with('success', 'Item de menu atualizado.');
    }

    public function destroy(MenuItem $menuItem): RedirectResponse
    {
        $this->menuService->delete($menuItem);

        return back()->with('success', 'Item de menu removido.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request): array
    {
        return $request->validate([
            'label'       => ['required', 'string', 'max:100'],
            'type'        => ['required', 'in:category,page,custom'],
            'category_id' => ['required_if:type,category', 'nullable', 'integer', 'exists:categories,id'],
            'page_key'    => ['required_if:type,page', 'nullable', 'in:'.implode(',', array_keys(MenuItem::PAGES))],
            'url'         => ['required_if:type,custom', 'nullable', 'string', 'max:255'],
            'position'    => ['integer', 'min:0'],
            'is_active'   => ['boolean'],
        ]);
    }
}
