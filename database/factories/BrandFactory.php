<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domains\Catalog\Models\Brand;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Brand> */
final class BrandFactory extends Factory
{
    protected $model = Brand::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = $this->faker->unique()->company();

        return [
            'name'      => $name,
            'slug'      => Str::slug($name).'-'.Str::random(4),
            'is_active' => true,
            'website'   => $this->faker->url(),
        ];
    }
}
