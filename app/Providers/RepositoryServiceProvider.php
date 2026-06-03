<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domains\Catalog\Contracts\BrandRepositoryInterface;
use App\Domains\Catalog\Contracts\CategoryRepositoryInterface;
use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Repositories\EloquentBrandRepository;
use App\Domains\Catalog\Repositories\EloquentCategoryRepository;
use App\Domains\Catalog\Repositories\EloquentProductRepository;
use App\Domains\Inventory\Contracts\ErpClientInterface;
use App\Domains\Integrations\Services\HttpErpClient;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Catalog
        $this->app->bind(CategoryRepositoryInterface::class, EloquentCategoryRepository::class);
        $this->app->bind(BrandRepositoryInterface::class, EloquentBrandRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);

        // ERP integration — troque HttpErpClient pela implementação real quando tiver credenciais
        $this->app->bind(ErpClientInterface::class, HttpErpClient::class);
    }
}
