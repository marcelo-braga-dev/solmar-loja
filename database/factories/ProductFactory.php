<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Product> */
final class ProductFactory extends Factory
{
    protected $model = Product::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name         = $this->faker->words(3, true);
        $priceCents   = $this->faker->numberBetween(5000, 500000);
        $hasDiscount  = $this->faker->boolean(30);

        return [
            'name'                   => ucwords($name),
            'slug'                   => Str::slug($name).'-'.Str::random(5),
            'sku'                    => 'SKU-'.strtoupper(Str::random(8)),
            'short_description'      => $this->faker->sentence(12),
            'description'            => $this->faker->paragraphs(3, true),
            'price_cents'            => $priceCents,
            'compare_at_price_cents' => $hasDiscount ? (int) ($priceCents * 1.3) : null,
            'cost_cents'             => (int) ($priceCents * 0.6),
            'status'                 => ProductStatus::Published,
            'brand_id'               => Brand::factory(),
            'weight_grams'           => $this->faker->numberBetween(500, 30000),
            'featured'               => $this->faker->boolean(20),
            'published_at'           => now()->subDays($this->faker->numberBetween(0, 365)),
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => ProductStatus::Draft, 'published_at' => null]);
    }

    public function published(): static
    {
        return $this->state(['status' => ProductStatus::Published, 'published_at' => now()]);
    }

    public function featured(): static
    {
        return $this->state(['featured' => true]);
    }

    public function withDiscount(float $discountPercent = 20): static
    {
        return $this->state(fn (array $attributes) => [
            'compare_at_price_cents' => (int) ($attributes['price_cents'] / (1 - $discountPercent / 100)),
        ]);
    }
}
