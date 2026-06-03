<?php

declare(strict_types=1);

namespace App\Domains\Payments\Events;

use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Models\Payment;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class PaymentApproved
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public readonly Payment $payment,
        public readonly Order $order,
    ) {}
}
