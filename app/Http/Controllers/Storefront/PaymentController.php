<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Orders\Models\Order;
use App\Domains\Payments\Data\PaymentRequestData;
use App\Domains\Payments\Enums\PaymentMethod;
use App\Domains\Payments\Services\PaymentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Enum;
use Inertia\Inertia;
use Inertia\Response;

final class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function show(Order $order): Response
    {
        $order->load('payments');

        $latestPayment = $order->payments->sortByDesc('created_at')->first();

        return Inertia::render('Storefront/Payment', [
            'order'   => [
                'uuid'        => $order->uuid,
                'status'      => $order->status->value,
                'total_cents' => $order->total_cents,
            ],
            'payment' => $latestPayment ? [
                'uuid'           => $latestPayment->uuid,
                'method'         => $latestPayment->method->value,
                'status'         => $latestPayment->status->value,
                'status_label'   => $latestPayment->status->label(),
                'pix_qr_code'    => $latestPayment->pix_qr_code,
                'pix_copy_paste' => $latestPayment->pix_copy_paste,
                'boleto_url'     => $latestPayment->boleto_url,
                'boleto_barcode' => $latestPayment->boleto_barcode,
                'expires_at'     => $latestPayment->expires_at?->toIso8601String(),
                'paid_at'        => $latestPayment->paid_at?->toIso8601String(),
            ] : null,
        ]);
    }

    public function store(Request $request, Order $order): RedirectResponse
    {
        $request->validate([
            'method'       => ['required', new Enum(PaymentMethod::class)],
            'installments' => ['integer', 'min:1', 'max:12'],
            'card_token'   => ['nullable', 'string'],
            'card_holder'  => ['nullable', 'string'],
            'cpf_cnpj'     => ['nullable', 'string'],
        ]);

        $paymentData = new PaymentRequestData(
            method: PaymentMethod::from($request->string('method')->value()),
            installments: $request->integer('installments', 1),
            cardToken: $request->string('card_token')->value() ?: null,
            cardHolder: $request->string('card_holder')->value() ?: null,
            cpfCnpj: $request->string('cpf_cnpj')->value() ?: null,
        );

        $payment = $this->paymentService->initiate($order, $paymentData);

        return to_route('payment.show', $order->uuid)
            ->with('success', 'Pagamento iniciado. Acompanhe as instruções abaixo.');
    }
}
