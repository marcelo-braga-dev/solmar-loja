<?php

declare(strict_types=1);

namespace App\Domains\Payments\Data;

use App\Domains\Payments\Enums\PaymentMethod;
use Spatie\LaravelData\Data;

final class PaymentRequestData extends Data
{
    public function __construct(
        public readonly PaymentMethod $method,
        public readonly int $installments = 1,
        public readonly ?string $cardToken = null,      // tokenizado pelo gateway no front
        public readonly ?string $cardHolder = null,
        public readonly ?string $cpfCnpj = null,
    ) {}
}
