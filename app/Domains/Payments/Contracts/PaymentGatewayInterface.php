<?php

declare(strict_types=1);

namespace App\Domains\Payments\Contracts;

use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Data\PaymentRequestData;
use App\Domains\Payments\Models\Payment;

interface PaymentGatewayInterface
{
    public function name(): string;

    public function createPix(Order $order, PaymentRequestData $data): Payment;

    public function createBoleto(Order $order, PaymentRequestData $data): Payment;

    public function createCreditCard(Order $order, PaymentRequestData $data): Payment;

    public function refund(Payment $payment, int $amountCents): bool;

    public function status(Payment $payment): string;
}
