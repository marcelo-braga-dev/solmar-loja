<?php

declare(strict_types=1);

namespace App\Domains\Payments\Services;

use App\Domains\Orders\Enums\OrderStatus;
use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Data\PaymentRequestData;
use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Events\PaymentApproved;
use App\Domains\Payments\Events\PaymentFailed;
use App\Domains\Payments\Gateways\AsaasGateway;
use App\Domains\Payments\Gateways\MercadoPagoGateway;
use App\Domains\Payments\Gateways\MockGateway;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Models\PaymentWebhook;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

final class PaymentService
{
    public function gateway(): PaymentGatewayInterface
    {
        return match (config('services.payment.gateway', 'mock')) {
            'mercadopago' => app(MercadoPagoGateway::class),
            'asaas' => app(AsaasGateway::class),
            default => app(MockGateway::class),
        };
    }

    public function initiate(Order $order, PaymentRequestData $data): Payment
    {
        $gateway = $this->gateway();

        $payment = match ($data->method) {
            PaymentMethod::Pix => $gateway->createPix($order, $data),
            PaymentMethod::Boleto => $gateway->createBoleto($order, $data),
            PaymentMethod::CreditCard => $gateway->createCreditCard($order, $data),
        };

        // Cartão aprovado imediatamente — dispara evento
        if ($payment->isApproved()) {
            $this->handleApproval($payment, $order);
        }

        return $payment;
    }

    public function processWebhook(string $gateway, string $eventType, string $eventId, array $payload): void
    {
        // Idempotência: ignora eventos já processados
        $existing = PaymentWebhook::where('gateway', $gateway)
            ->where('gateway_event_id', $eventId)
            ->first();

        if ($existing && $existing->status === 'processed') {
            return;
        }

        $webhook = PaymentWebhook::updateOrCreate(
            ['gateway' => $gateway, 'gateway_event_id' => $eventId],
            ['event_type' => $eventType, 'payload' => $payload, 'status' => 'received'],
        );

        DB::transaction(function () use ($webhook, $payload, $eventType, $gateway): void {
            try {
                $this->handleWebhookEvent($gateway, $eventType, $payload);
                $webhook->update(['status' => 'processed', 'processed_at' => now()]);
            } catch (\Throwable $e) {
                $webhook->update(['status' => 'failed', 'error' => $e->getMessage()]);
                Log::error('Payment webhook processing failed', [
                    'webhook_id' => $webhook->id,
                    'error' => $e->getMessage(),
                ]);
                throw $e;
            }
        });
    }

    public function approve(Payment $payment): void
    {
        if ($payment->status !== PaymentStatus::Pending) {
            return;
        }

        $payment->update(['status' => PaymentStatus::Approved, 'paid_at' => now()]);

        $this->handleApproval($payment, $payment->order);
    }

    public function fail(Payment $payment): void
    {
        $payment->update(['status' => PaymentStatus::Failed]);

        event(new PaymentFailed($payment, $payment->order));
    }

    public function refund(Payment $payment, ?int $amountCents = null): bool
    {
        $amount = $amountCents ?? $payment->amount_cents;
        $result = $this->gateway()->refund($payment, $amount);

        if ($result) {
            $payment->update(['status' => PaymentStatus::Refunded]);
            $payment->order->update(['status' => OrderStatus::Refunded]);
        }

        return $result;
    }

    private function handleApproval(Payment $payment, Order $order): void
    {
        $order->update(['status' => OrderStatus::Paid]);

        event(new PaymentApproved($payment, $order));
    }

    private function handleWebhookEvent(string $gateway, string $eventType, array $payload): void
    {
        $gatewayTxId = $payload['data']['id'] ?? $payload['transaction_id'] ?? $payload['id'] ?? null;

        if (! $gatewayTxId) {
            return;
        }

        $payment = Payment::where('gateway_transaction_id', (string) $gatewayTxId)->first();

        if (! $payment) {
            return;
        }

        // Mercado Pago sempre notifica type=payment, sem indicar o status no corpo —
        // a documentação recomenda nunca confiar no payload e sempre reconsultar a API.
        if ($gateway === 'mercadopago') {
            match (app(MercadoPagoGateway::class)->status($payment)) {
                PaymentStatus::Approved->value => $this->approve($payment),
                PaymentStatus::Failed->value, PaymentStatus::Expired->value => $this->fail($payment),
                default => null,
            };

            return;
        }

        match ($eventType) {
            'payment.approved', 'pix.received', 'boleto.paid' => $this->approve($payment),
            'payment.failed', 'payment.expired' => $this->fail($payment),
            default => null,
        };
    }
}
