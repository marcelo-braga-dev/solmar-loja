<?php

declare(strict_types=1);

namespace App\Domains\Payments\Listeners;

use App\Domains\Financial\Services\FinancialService;
use App\Domains\Payments\Events\PaymentApproved;
use Illuminate\Contracts\Queue\ShouldQueue;

final class CreateTransactionOnPaymentApproved implements ShouldQueue
{
    public string $queue = 'default';

    public function __construct(
        private readonly FinancialService $financial,
    ) {}

    public function handle(PaymentApproved $event): void
    {
        $this->financial->createFromOrder($event->order);
    }
}
