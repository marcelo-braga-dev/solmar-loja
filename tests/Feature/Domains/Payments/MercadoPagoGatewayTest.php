<?php

declare(strict_types=1);

use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Data\PaymentRequestData;
use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Enums\PaymentStatus;
use App\Domains\Payments\Gateways\MercadoPagoGateway;
use App\Domains\Payments\Models\Payment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    config(['services.mercadopago.access_token' => 'TEST-access-token']);
});

function makeMercadoPagoOrder(): Order
{
    $user = User::factory()->create();

    return Order::create([
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
}

it('creates a pix payment via mercadopago', function (): void {
    Http::fake([
        'api.mercadopago.com/v1/payments' => Http::response([
            'id' => 123456,
            'status' => 'pending',
            'point_of_interaction' => [
                'transaction_data' => [
                    'qr_code' => '00020126...copy-paste',
                    'qr_code_base64' => str_repeat('A', 2000),
                ],
            ],
        ], 201),
    ]);

    $order = makeMercadoPagoOrder();
    $gateway = new MercadoPagoGateway;

    $payment = $gateway->createPix($order, new PaymentRequestData(method: PaymentMethod::Pix));

    expect($payment->method)->toBe(PaymentMethod::Pix);
    expect($payment->gateway)->toBe('mercadopago');
    expect($payment->gateway_transaction_id)->toBe('123456');
    expect($payment->status)->toBe(PaymentStatus::Pending);
    expect($payment->pix_copy_paste)->toBe('00020126...copy-paste');
    expect(strlen((string) $payment->pix_qr_code))->toBe(2000);
});

it('creates a boleto payment via mercadopago', function (): void {
    Http::fake([
        'api.mercadopago.com/v1/payments' => Http::response([
            'id' => 654321,
            'status' => 'pending',
            'transaction_details' => ['external_resource_url' => 'https://mp.test/boleto.pdf'],
            'barcode' => ['content' => '34191790010104351004791020150008111000260000'],
        ], 201),
    ]);

    $order = makeMercadoPagoOrder();
    $gateway = new MercadoPagoGateway;

    $payment = $gateway->createBoleto($order, new PaymentRequestData(method: PaymentMethod::Boleto));

    expect($payment->boleto_url)->toBe('https://mp.test/boleto.pdf');
    expect($payment->boleto_barcode)->toBe('34191790010104351004791020150008111000260000');
    expect($payment->status)->toBe(PaymentStatus::Pending);
});

it('creates an approved credit card payment via mercadopago', function (): void {
    Http::fake([
        'api.mercadopago.com/v1/payments' => Http::response([
            'id' => 789012,
            'status' => 'approved',
            'payment_method_id' => 'visa',
            'card' => ['last_four_digits' => '4242'],
        ], 201),
    ]);

    $order = makeMercadoPagoOrder();
    $gateway = new MercadoPagoGateway;

    $payment = $gateway->createCreditCard($order, new PaymentRequestData(
        method: PaymentMethod::CreditCard,
        installments: 3,
        cardToken: 'card-token-abc',
        cardBrand: 'visa',
        cardIssuerId: '123',
    ));

    expect($payment->status)->toBe(PaymentStatus::Approved);
    expect($payment->card_last4)->toBe('4242');
    expect($payment->card_brand)->toBe('visa');
    expect($payment->installments)->toBe(3);
    expect($payment->paid_at)->not->toBeNull();
});

it('throws when creating a credit card payment without a token', function (): void {
    $order = makeMercadoPagoOrder();
    $gateway = new MercadoPagoGateway;

    expect(fn () => $gateway->createCreditCard($order, new PaymentRequestData(method: PaymentMethod::CreditCard)))
        ->toThrow(RuntimeException::class);
});

it('throws a friendly RuntimeException on api errors', function (): void {
    Http::fake([
        'api.mercadopago.com/*' => Http::response(['message' => 'invalid access token'], 401),
    ]);

    $order = makeMercadoPagoOrder();
    $gateway = new MercadoPagoGateway;

    expect(fn () => $gateway->createPix($order, new PaymentRequestData(method: PaymentMethod::Pix)))
        ->toThrow(RuntimeException::class);
});

it('throws when access token is not configured', function (): void {
    config(['services.mercadopago.access_token' => null]);

    $order = makeMercadoPagoOrder();
    $gateway = new MercadoPagoGateway;

    expect(fn () => $gateway->createPix($order, new PaymentRequestData(method: PaymentMethod::Pix)))
        ->toThrow(RuntimeException::class);
});

it('refunds a payment', function (): void {
    Http::fake([
        'api.mercadopago.com/v1/payments/*/refunds' => Http::response(['id' => 1], 201),
    ]);

    $order = makeMercadoPagoOrder();
    $payment = Payment::create([
        'order_id' => $order->id,
        'method' => PaymentMethod::CreditCard,
        'gateway' => 'mercadopago',
        'gateway_transaction_id' => '789012',
        'status' => PaymentStatus::Approved,
        'amount_cents' => 100000,
    ]);

    $gateway = new MercadoPagoGateway;
    $result = $gateway->refund($payment, 100000);

    expect($result)->toBeTrue();
    expect($payment->fresh()->status)->toBe(PaymentStatus::Refunded);
});

it('returns the locally stored status when the api call fails on status()', function (): void {
    Http::fake([
        'api.mercadopago.com/*' => Http::response([], 500),
    ]);

    $order = makeMercadoPagoOrder();
    $payment = Payment::create([
        'order_id' => $order->id,
        'method' => PaymentMethod::Pix,
        'gateway' => 'mercadopago',
        'gateway_transaction_id' => '123456',
        'status' => PaymentStatus::Pending,
        'amount_cents' => 100000,
    ]);

    $gateway = new MercadoPagoGateway;

    expect($gateway->status($payment))->toBe('pending');
});
