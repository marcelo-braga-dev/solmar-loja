<?php

declare(strict_types=1);

namespace App\Domains\Auth\Data;

use Spatie\LaravelData\Data;

final class AdminUserData extends Data
{
    public function __construct(
        public readonly string $name,
        public readonly string $email,
        public readonly string $password,
        public readonly string $role,
    ) {}
}
