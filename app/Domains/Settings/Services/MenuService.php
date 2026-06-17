<?php

declare(strict_types=1);

namespace App\Domains\Settings\Services;

use App\Domains\Settings\Models\MenuItem;
use Illuminate\Database\Eloquent\Collection;

final class MenuService
{
    /** @return Collection<int, MenuItem> */
    public function allForAdmin(): Collection
    {
        return MenuItem::query()->with('category')->orderBy('position')->get();
    }

    /** @return array<int, array{label: string, href: string}> */
    public function forStorefront(): array
    {
        return MenuItem::query()
            ->with('category')
            ->where('is_active', true)
            ->orderBy('position')
            ->get()
            ->map(fn (MenuItem $item) => ['label' => $item->label, 'href' => $item->href()])
            ->filter(fn (array $item) => $item['href'] !== null)
            ->values()
            ->toArray();
    }

    public function create(array $data): MenuItem
    {
        return MenuItem::create($data);
    }

    public function update(MenuItem $item, array $data): MenuItem
    {
        $item->update($data);

        return $item->fresh();
    }

    public function delete(MenuItem $item): void
    {
        $item->delete();
    }
}
