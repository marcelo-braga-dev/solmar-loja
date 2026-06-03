<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domains\Catalog\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<Category> */
final class CategoryFactory extends Factory
{
    protected $model = Category::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $name = $this->faker->unique()->words(2, true);

        return [
            'name'      => ucfirst($name),
            'slug'      => Str::slug($name).'-'.Str::random(4),
            'parent_id' => null,
            'is_active' => true,
            'position'  => $this->faker->numberBetween(0, 10),
        ];
    }
}
