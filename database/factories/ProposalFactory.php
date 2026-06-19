<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Domains\Orders\Models\Proposal;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Proposal> */
final class ProposalFactory extends Factory
{
    protected $model = Proposal::class;

    /** @return array<string, mixed> */
    public function definition(): array
    {
        $subtotal = $this->faker->numberBetween(100000, 2000000);

        return [
            'user_id' => User::factory(),
            'title' => 'Proposta '.ucwords($this->faker->words(3, true)),
            'customer_name' => $this->faker->name(),
            'customer_email' => $this->faker->safeEmail(),
            'customer_phone' => $this->faker->numerify('11#########'),
            'customer_city' => $this->faker->city(),
            'customer_state' => $this->faker->randomElement(['SP', 'RJ', 'MG', 'PR', 'RS', 'BA']),
            'status' => 'draft',
            'subtotal_cents' => $subtotal,
            'discount_cents' => 0,
            'tax_cents' => 0,
            'total_cents' => $subtotal,
        ];
    }
}
