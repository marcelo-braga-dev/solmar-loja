<?php

declare(strict_types=1);

namespace App\Domains\Payments\Gateways;

use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Contracts\PaymentGatewayInterface;
use App\Domains\Payments\Data\PaymentRequestData;
use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Payment;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

/**
 * Gateway Asaas — https://www.asaas.com/
 * Documentação: https://docs.asaas.com/
 *
 * Configurar no .env:
 *   ASAAS_API_KEY=your_key
 *   ASAAS_ENVIRONMENT=sandbox|production
 */
final class AsaasGateway implements PaymentGatewayInterface
{
    private string $baseUrl;

    public function __construct()
    {
        $env           = config('services.asaas.environment', 'sandbox');
        $this->baseUrl = $env === 'production'
            ? 'https://api.asaas.com/v3'
            : 'https://sandbox.asaas.com/api/v3';
    }

    public function name(): string
    {
        return 'asaas';
    }

    public function createPix(Order $order, PaymentRequestData $data): Payment
    {
        $customerId = $this->ensureCustomer($order);

        $response = $this->request('POST', '/payments', [
            'customer'          => $customerId,
            'billingType'       => 'PIX',
            'value'             => $order->total_cents / 100,
            'dueDate'           => now()->addMinutes(30)->format('Y-m-d'),
            'description'       => "Pedido #{$order->uuid}",
            'externalReference' => $order->uuid,
        ]);

        $pixQr = $this->request('GET', "/payments/{$response['id']}/pixQrCode");

        return Payment::create([
            'order_id'               => $order->id,
            'method'                 => PaymentMethod::Pix,
            'gateway'                => $this->name(),
            'gateway_transaction_id' => $response['id'],
            'status'                 => PaymentStatus::Pending,
            'amount_cents'           => $order->total_cents,
            'pix_qr_code'            => $pixQr['encodedImage'] ?? null,
            'pix_copy_paste'         => $pixQr['payload'] ?? null,
            'expires_at'             => now()->addMinutes(30),
            'gateway_payload'        => $response,
        ]);
    }

    public function createBoleto(Order $order, PaymentRequestData $data): Payment
    {
        $customerId = $this->ensureCustomer($order);

        $response = $this->request('POST', '/payments', [
            'customer'          => $customerId,
            'billingType'       => 'BOLETO',
            'value'             => $order->total_cents / 100,
            'dueDate'           => now()->addDays(3)->format('Y-m-d'),
            'description'       => "Pedido #{$order->uuid}",
            'externalReference' => $order->uuid,
        ]);

        return Payment::create([
            'order_id'               => $order->id,
            'method'                 => PaymentMethod::Boleto,
            'gateway'                => $this->name(),
            'gateway_transaction_id' => $response['id'],
            'status'                 => PaymentStatus::Pending,
            'amount_cents'           => $order->total_cents,
            'boleto_url'             => $response['bankSlipUrl'] ?? null,
            'boleto_barcode'         => $response['nossoNumero'] ?? null,
            'expires_at'             => now()->addDays(3),
            'gateway_payload'        => $response,
        ]);
    }

    public function createCreditCard(Order $order, PaymentRequestData $data): Payment
    {
        $customerId = $this->ensureCustomer($order);

        $payload = [
            'customer'          => $customerId,
            'billingType'       => 'CREDIT_CARD',
            'value'             => $order->total_cents / 100,
            'dueDate'           => now()->format('Y-m-d'),
            'description'       => "Pedido #{$order->uuid}",
            'externalReference' => $order->uuid,
            'installmentCount'  => $data->installments,
        ];

        if ($data->cardToken) {
            $payload['creditCardToken'] = $data->cardToken;
        }

        $response = $this->request('POST', '/payments', $payload);

        $status = match ($response['status'] ?? 'PENDING') {
            'CONFIRMED', 'RECEIVED' => PaymentStatus::Approved,
            'OVERDUE'               => PaymentStatus::Failed,
            default                 => PaymentStatus::Pending,
        };

        return Payment::create([
            'order_id'               => $order->id,
            'method'                 => PaymentMethod::CreditCard,
            'gateway'                => $this->name(),
            'gateway_transaction_id' => $response['id'],
            'status'                 => $status,
            'amount_cents'           => $order->total_cents,
            'installments'           => $data->installments,
            'paid_at'                => $status === PaymentStatus::Approved ? now() : null,
            'gateway_payload'        => $response,
        ]);
    }

    public function refund(Payment $payment, int $amountCents): bool
    {
        try {
            $this->request('POST', "/payments/{$payment->gateway_transaction_id}/refund", [
                'value' => $amountCents / 100,
            ]);

            $payment->update(['status' => PaymentStatus::Refunded]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Asaas refund failed', [
                'payment_id' => $payment->id,
                'error'      => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function status(Payment $payment): string
    {
        try {
            $response = $this->request('GET', "/payments/{$payment->gateway_transaction_id}");

            return match ($response['status'] ?? 'PENDING') {
                'CONFIRMED', 'RECEIVED' => PaymentStatus::Approved->value,
                'OVERDUE'               => PaymentStatus::Failed->value,
                'REFUNDED'              => PaymentStatus::Refunded->value,
                default                 => PaymentStatus::Pending->value,
            };
        } catch (\Throwable) {
            return $payment->status->value;
        }
    }

    private function ensureCustomer(Order $order): string
    {
        $user = $order->user;

        if (! $user) {
            throw new RuntimeException('Pedido sem usuário associado.');
        }

        // Busca cliente existente pelo e-mail
        $existing = $this->request('GET', '/customers', ['email' => $user->email]);

        if (! empty($existing['data'])) {
            return $existing['data'][0]['id'];
        }

        $customer = $this->request('POST', '/customers', [
            'name'  => $user->name,
            'email' => $user->email,
            'cpfCnpj' => null,
        ]);

        return $customer['id'];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private function request(string $method, string $endpoint, array $payload = []): array
    {
        $apiKey = config('services.asaas.api_key');

        if (empty($apiKey)) {
            throw new RuntimeException('ASAAS_API_KEY não configurada.');
        }

        try {
            $response = Http::withHeaders([
                'access_token' => $apiKey,
                'Content-Type' => 'application/json',
            ])
                ->timeout(30)
                ->retry(2, 500)
                ->{strtolower($method)}($this->baseUrl . $endpoint, $payload);

            $response->throw();

            return $response->json();
        } catch (RequestException $e) {
            Log::error('Asaas API error', [
                'endpoint' => $endpoint,
                'status'   => $e->response->status(),
                'body'     => $e->response->body(),
            ]);

            throw new RuntimeException(
                "Erro no gateway de pagamento ({$e->response->status()}): " . $e->response->json('errors.0.description', 'Tente novamente.'),
            );
        }
    }
}
