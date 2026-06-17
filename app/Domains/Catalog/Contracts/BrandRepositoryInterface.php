<?php

declare(strict_types=1);

namespace App\Domains\Catalog\Contracts;

use App\Domains\Catalog\Data\BrandData;
use App\Domains\Catalog\Models\Brand;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

interface BrandRepositoryInterface
{
    /** @return Collection<int, Brand> */
    public function allActive(): Collection;

    /** @return LengthAwarePaginator<Brand> */
    public function paginate(int $perPage = 15): LengthAwarePaginator;

    public function findBySlug(string $slug): ?Brand;

    public function findById(int $id): ?Brand;

    /**
     * Busca uma marca pelo nome (via slug) ou cria uma nova — usado por sincronizações
     * externas que recebem apenas o nome da marca (ex.: marca do inversor/painel).
     * Se a marca já existir sem logo e `$logoUrl` for informado, o logo é preenchido.
     */
    public function findOrCreateByName(string $name, ?string $logoUrl = null): Brand;

    public function create(BrandData $data): Brand;

    public function update(Brand $brand, BrandData $data): Brand;

    public function delete(Brand $brand): void;
}
