<?php

declare(strict_types=1);

namespace App\Domains\Orders\Events;

use App\Domains\Orders\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

final class OrderPlaced
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(public readonly Order $order) {}
}
