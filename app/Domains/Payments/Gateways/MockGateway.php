<?php

declare(strict_types=1);

namespace App\Domains\Payments\Gateways;

use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Data\PaymentRequestData;
use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Payment;
use Illuminate\Support\Str;

/**
 * Gateway de simulação para desenvolvimento e testes.
 * Nunca usar em produção.
 */
final class MockGateway implements PaymentGatewayInterface
{
    public function name(): string
    {
        return 'mock';
    }

    public function createPix(Order $order, PaymentRequestData $data): Payment
    {
        $txId = 'MOCK-PIX-'.strtoupper(Str::random(12));

        return Payment::create([
            'order_id'             => $order->id,
            'method'               => PaymentMethod::Pix,
            'gateway'              => $this->name(),
            'gateway_transaction_id' => $txId,
            'status'               => PaymentStatus::Pending,
            'amount_cents'         => $order->total_cents,
            'pix_qr_code'          => base64_encode("00020126580014br.gov.bcb.pix0136{$txId}5204000053039865802BR5925SOLARHUB COMMERCE LTDA6009SAO PAULO62070503***6304"),
            'pix_copy_paste'       => "00020126580014br.gov.bcb.pix0136{$txId}5204000053039865802BR5925SOLARHUB COMMERCE LTDA6009SAO PAULO62070503***6304ABCD",
            'expires_at'           => now()->addMinutes(30),
            'gateway_payload'      => ['transaction_id' => $txId, 'env' => 'mock'],
        ]);
    }

    public function createBoleto(Order $order, PaymentRequestData $data): Payment
    {
        $txId = 'MOCK-BOLETO-'.strtoupper(Str::random(10));

        return Payment::create([
            'order_id'             => $order->id,
            'method'               => PaymentMethod::Boleto,
            'gateway'              => $this->name(),
            'gateway_transaction_id' => $txId,
            'status'               => PaymentStatus::Pending,
            'amount_cents'         => $order->total_cents,
            'boleto_url'           => 'https://mock.gateway.com/boleto/'.$txId.'.pdf',
            'boleto_barcode'       => '34191.79001 01043.510047 91020.150008 1 10010026000'.rand(10000, 99999),
            'expires_at'           => now()->addDays(3),
            'gateway_payload'      => ['transaction_id' => $txId, 'env' => 'mock'],
        ]);
    }

    public function createCreditCard(Order $order, PaymentRequestData $data): Payment
    {
        $txId = 'MOCK-CC-'.strtoupper(Str::random(12));

        return Payment::create([
            'order_id'             => $order->id,
            'method'               => PaymentMethod::CreditCard,
            'gateway'              => $this->name(),
            'gateway_transaction_id' => $txId,
            'status'               => PaymentStatus::Approved,
            'amount_cents'         => $order->total_cents,
            'installments'         => $data->installments,
            'card_last4'           => '4242',
            'card_brand'           => 'Visa',
            'paid_at'              => now(),
            'gateway_payload'      => ['transaction_id' => $txId, 'env' => 'mock', 'approved' => true],
        ]);
    }

    public function refund(Payment $payment, int $amountCents): bool
    {
        $payment->update(['status' => PaymentStatus::Refunded]);

        return true;
    }

    public function status(Payment $payment): string
    {
        return $payment->status->value;
    }
}
