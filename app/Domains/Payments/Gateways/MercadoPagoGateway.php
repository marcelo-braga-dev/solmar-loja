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
use Illuminate\Support\Str;
use RuntimeException;

/**
 * Gateway Mercado Pago — https://www.mercadopago.com.br/
 * Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api
 *
 * Configurar no .env:
 *   MERCADOPAGO_ACCESS_TOKEN=your_token   (TEST-... em sandbox, APP_USR-... em produção)
 *   MERCADOPAGO_PUBLIC_KEY=your_public_key
 *   MERCADOPAGO_WEBHOOK_SECRET=your_webhook_secret
 */
final class MercadoPagoGateway implements PaymentGatewayInterface
{
    private const BASE_URL = 'https://api.mercadopago.com';

    public function name(): string
    {
        return 'mercadopago';
    }

    public function createPix(Order $order, PaymentRequestData $data): Payment
    {
        $response = $this->request('POST', '/v1/payments', [
            'transaction_amount' => $order->total_cents / 100,
            'description' => "Pedido #{$order->uuid}",
            'payment_method_id' => 'pix',
            'date_of_expiration' => now()->addMinutes(30)->format('Y-m-d\TH:i:s.vP'),
            'external_reference' => $order->uuid,
            'payer' => $this->payer($order, $data),
        ]);

        $transactionData = $response['point_of_interaction']['transaction_data'] ?? [];

        return Payment::create([
            'order_id' => $order->id,
            'method' => PaymentMethod::Pix,
            'gateway' => $this->name(),
            'gateway_transaction_id' => (string) $response['id'],
            'status' => $this->mapStatus($response['status'] ?? 'pending'),
            'amount_cents' => $order->total_cents,
            'pix_qr_code' => $transactionData['qr_code_base64'] ?? null,
            'pix_copy_paste' => $transactionData['qr_code'] ?? null,
            'expires_at' => now()->addMinutes(30),
            'gateway_payload' => $response,
        ]);
    }

    public function createBoleto(Order $order, PaymentRequestData $data): Payment
    {
        $response = $this->request('POST', '/v1/payments', [
            'transaction_amount' => $order->total_cents / 100,
            'description' => "Pedido #{$order->uuid}",
            'payment_method_id' => 'bolbradesco',
            'date_of_expiration' => now()->addDays(3)->format('Y-m-d\TH:i:s.vP'),
            'external_reference' => $order->uuid,
            'payer' => [
                ...$this->payer($order, $data),
                'address' => $this->payerAddress($order),
            ],
        ]);

        return Payment::create([
            'order_id' => $order->id,
            'method' => PaymentMethod::Boleto,
            'gateway' => $this->name(),
            'gateway_transaction_id' => (string) $response['id'],
            'status' => $this->mapStatus($response['status'] ?? 'pending'),
            'amount_cents' => $order->total_cents,
            'boleto_url' => $response['transaction_details']['external_resource_url'] ?? null,
            'boleto_barcode' => $response['barcode']['content'] ?? null,
            'expires_at' => now()->addDays(3),
            'gateway_payload' => $response,
        ]);
    }

    public function createCreditCard(Order $order, PaymentRequestData $data): Payment
    {
        if (! $data->cardToken) {
            throw new RuntimeException('Token do cartão não informado.');
        }

        $response = $this->request('POST', '/v1/payments', [
            'transaction_amount' => $order->total_cents / 100,
            'token' => $data->cardToken,
            'description' => "Pedido #{$order->uuid}",
            'installments' => $data->installments,
            'payment_method_id' => $data->cardBrand,
            'issuer_id' => $data->cardIssuerId,
            'external_reference' => $order->uuid,
            'payer' => $this->payer($order, $data),
        ]);

        $status = $this->mapStatus($response['status'] ?? 'pending');

        return Payment::create([
            'order_id' => $order->id,
            'method' => PaymentMethod::CreditCard,
            'gateway' => $this->name(),
            'gateway_transaction_id' => (string) $response['id'],
            'status' => $status,
            'amount_cents' => $order->total_cents,
            'installments' => $data->installments,
            'card_last4' => $response['card']['last_four_digits'] ?? null,
            'card_brand' => $response['payment_method_id'] ?? $data->cardBrand,
            'paid_at' => $status === PaymentStatus::Approved ? now() : null,
            'gateway_payload' => $response,
        ]);
    }

    public function refund(Payment $payment, int $amountCents): bool
    {
        try {
            $body = $amountCents < $payment->amount_cents
                ? ['amount' => $amountCents / 100]
                : [];

            $this->request('POST', "/v1/payments/{$payment->gateway_transaction_id}/refunds", $body);

            $payment->update(['status' => PaymentStatus::Refunded]);

            return true;
        } catch (\Throwable $e) {
            Log::error('Mercado Pago refund failed', [
                'payment_id' => $payment->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function status(Payment $payment): string
    {
        try {
            $response = $this->request('GET', "/v1/payments/{$payment->gateway_transaction_id}");

            return $this->mapStatus($response['status'] ?? 'pending')->value;
        } catch (\Throwable) {
            return $payment->status->value;
        }
    }

    private function mapStatus(string $mpStatus): PaymentStatus
    {
        return match ($mpStatus) {
            'approved' => PaymentStatus::Approved,
            'rejected', 'cancelled' => PaymentStatus::Failed,
            'refunded', 'charged_back' => PaymentStatus::Refunded,
            'in_process', 'in_mediation' => PaymentStatus::Processing,
            default => PaymentStatus::Pending,
        };
    }

    /**
     * @return array<string, mixed>
     */
    private function payer(Order $order, PaymentRequestData $data): array
    {
        $user = $order->user;

        if (! $user) {
            throw new RuntimeException('Pedido sem usuário associado.');
        }

        $nameParts = explode(' ', trim($data->cardHolder ?? $user->name), 2);
        $cpfCnpj = preg_replace('/\D/', '', $data->cpfCnpj ?? $user->customer?->cpf_cnpj ?? '');

        return [
            'email' => $user->email,
            'first_name' => $nameParts[0],
            'last_name' => $nameParts[1] ?? '',
            'identification' => [
                'type' => strlen((string) $cpfCnpj) > 11 ? 'CNPJ' : 'CPF',
                'number' => $cpfCnpj ?: null,
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function payerAddress(Order $order): array
    {
        $address = $order->shipping_address ?? [];

        return [
            'zip_code' => preg_replace('/\D/', '', $address['cep'] ?? ''),
            'street_name' => $address['street'] ?? '',
            'street_number' => $address['number'] ?? '',
            'neighborhood' => $address['district'] ?? '',
            'city' => $address['city'] ?? '',
            'federal_unit' => $address['state'] ?? '',
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function request(string $method, string $endpoint, array $payload = []): array
    {
        $accessToken = config('services.mercadopago.access_token');

        if (empty($accessToken)) {
            throw new RuntimeException('MERCADOPAGO_ACCESS_TOKEN não configurada.');
        }

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$accessToken,
                'Content-Type' => 'application/json',
                'X-Idempotency-Key' => (string) Str::uuid(),
            ])
                ->timeout(30)
                ->retry(2, 500)
                ->{strtolower($method)}(self::BASE_URL.$endpoint, $payload);

            $response->throw();

            return $response->json();
        } catch (RequestException $e) {
            Log::error('Mercado Pago API error', [
                'endpoint' => $endpoint,
                'status' => $e->response->status(),
                'body' => $e->response->body(),
            ]);

            throw new RuntimeException(
                "Erro no gateway de pagamento ({$e->response->status()}): ".$e->response->json(
                    'message',
                    $e->response->json('cause.0.description', 'Tente novamente.'),
                ),
            );
        }
    }
}
