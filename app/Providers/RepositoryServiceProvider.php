<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domains\Catalog\Contracts\BrandRepositoryInterface;
use App\Domains\Catalog\Contracts\CategoryRepositoryInterface;
use App\Domains\Catalog\Contracts\ProductRepositoryInterface;
use App\Domains\Catalog\Contracts\SolarKitSpecificationRepositoryInterface;
use App\Domains\Catalog\Repositories\EloquentBrandRepository;
use App\Domains\Catalog\Repositories\EloquentCategoryRepository;
use App\Domains\Catalog\Repositories\EloquentProductRepository;
use App\Domains\Catalog\Repositories\EloquentSolarKitSpecificationRepository;
use App\Domains\Integrations\Contracts\AppSolarClientInterface;
use App\Domains\Integrations\Services\AppSolarHttpClient;
use App\Domains\Integrations\Services\HttpErpClient;
use App\Domains\Inventory\Contracts\ErpClientInterface;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Catalog
        $this->app->bind(CategoryRepositoryInterface::class, EloquentCategoryRepository::class);
        $this->app->bind(BrandRepositoryInterface::class, EloquentBrandRepository::class);
        $this->app->bind(ProductRepositoryInterface::class, EloquentProductRepository::class);
        $this->app->bind(SolarKitSpecificationRepositoryInterface::class, EloquentSolarKitSpecificationRepository::class);

        // ERP integration — troque HttpErpClient pela implementação real quando tiver credenciais
        $this->app->bind(ErpClientInterface::class, HttpErpClient::class);

        // AppSolar (Edeltec) — catálogo de kits fotovoltaicos
        $this->app->bind(AppSolarClientInterface::class, AppSolarHttpClient::class);
    }
}
