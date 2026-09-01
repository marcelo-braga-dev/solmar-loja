<?php

declare(strict_types=1);

use App\Domains\Orders\Enums\OrderStatus;
use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Models\Payment;
use App\Domains\Payments\Models\PaymentWebhook;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

/**
 * @return array{0: Order, 1: Payment}
 */
function makeMercadoPagoWebhookFixtures(): array
{
    $user = User::factory()->create();

    $order = Order::create([
        'user_id' => $user->id,
        'status' => 'pending',
        'subtotal_cents' => 100000,
        'discount_cents' => 0,
        'shipping_cents' => 0,
        'total_cents' => 100000,
        'shipping_address' => [
            'recipient' => 'Maria Souza',
            'cep' => '01310-100',
            'street' => 'Av. Paulista',
            'number' => '1000',
            'district' => 'Bela Vista',
            'city' => 'São Paulo',
            'state' => 'SP',
        ],
        'shipping_method' => 'PAC',
        'placed_at' => now(),
    ]);

    $payment = Payment::create([
        'order_id' => $order->id,
        'method' => PaymentMethod::Pix,
        'gateway' => 'mercadopago',
        'gateway_transaction_id' => '999888',
        'status' => PaymentStatus::Pending,
        'amount_cents' => 100000,
    ]);

    return [$order, $payment];
}

it('rejects a mercadopago webhook with invalid signature when a secret is configured', function (): void {
    config(['services.mercadopago.webhook_secret' => 'whsec_test']);

    $response = $this->postJson('/webhooks/mercadopago?data.id=999888', [
        'type' => 'payment',
        'data' => ['id' => '999888'],
    ], [
        'x-signature' => 'ts=1700000000,v1=deadbeef',
        'x-request-id' => 'req-1',
    ]);

    $response->assertStatus(401);
});

it('accepts a valid mercadopago webhook signature and approves the payment', function (): void {
    config(['services.mercadopago.access_token' => 'TEST-token']);
    config(['services.mercadopago.webhook_secret' => 'whsec_test']);

    [$order, $payment] = makeMercadoPagoWebhookFixtures();

    Http::fake([
        'api.mercadopago.com/v1/payments/999888' => Http::response(['id' => 999888, 'status' => 'approved'], 200),
    ]);

    $ts = (string) time();
    $requestId = 'req-2';
    $dataId = '999888';
    $manifest = "id:{$dataId};request-id:{$requestId};ts:{$ts};";
    $signature = hash_hmac('sha256', $manifest, 'whsec_test');

    $response = $this->postJson("/webhooks/mercadopago?data.id={$dataId}", [
        'type' => 'payment',
        'data' => ['id' => $dataId],
    ], [
        'x-signature' => "ts={$ts},v1={$signature}",
        'x-request-id' => $requestId,
    ]);

    $response->assertStatus(200);
    expect($payment->fresh()->status)->toBe(PaymentStatus::Approved);
    expect($order->fresh()->status)->toBe(OrderStatus::Paid);
});

it('does not reprocess an already processed mercadopago webhook event', function (): void {
    config(['services.mercadopago.access_token' => 'TEST-token']);
    config(['services.mercadopago.webhook_secret' => '']);

    [$order, $payment] = makeMercadoPagoWebhookFixtures();

    Http::fake([
        'api.mercadopago.com/v1/payments/999888' => Http::response(['id' => 999888, 'status' => 'approved'], 200),
    ]);

    $payload = ['type' => 'payment', 'data' => ['id' => '999888']];

    $this->postJson('/webhooks/mercadopago?data.id=999888', $payload)->assertStatus(200);
    $this->postJson('/webhooks/mercadopago?data.id=999888', $payload)->assertStatus(200);

    Http::assertSentCount(1);
    expect(PaymentWebhook::where('gateway', 'mercadopago')->count())->toBe(1);
    expect($payment->fresh()->status)->toBe(PaymentStatus::Approved);
});
