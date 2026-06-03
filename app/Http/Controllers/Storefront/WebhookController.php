<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Payments\Services\PaymentService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

final class WebhookController extends Controller
{
    public function __construct(private readonly PaymentService $paymentService) {}

    public function handle(Request $request, string $gateway): JsonResponse
    {
        if (! $this->verifySignature($request, $gateway)) {
            Log::warning('Webhook with invalid signature rejected', ['gateway' => $gateway]);

            return response()->json(['status' => 'unauthorized'], 401);
        }

        Log::info('Webhook received', ['gateway' => $gateway, 'ip' => $request->ip()]);

        try {
            $payload   = $request->all();
            $eventType = $payload['type'] ?? $payload['event'] ?? 'unknown';
            $eventId   = $payload['id'] ?? $payload['payment']['id'] ?? uniqid('evt_');

            $this->paymentService->processWebhook($gateway, $eventType, $eventId, $payload);

            return response()->json(['status' => 'ok']);
        } catch (\Throwable $e) {
            Log::error('Webhook processing error', ['gateway' => $gateway, 'error' => $e->getMessage()]);

            return response()->json(['status' => 'error'], 500);
        }
    }

    private function verifySignature(Request $request, string $gateway): bool
    {
        return match ($gateway) {
            'asaas' => $this->verifyAsaas($request),
            'mock'  => true,
            default => true,
        };
    }

    private function verifyAsaas(Request $request): bool
    {
        $accessToken = config('services.asaas.api_key', '');

        if (empty($accessToken)) {
            return true;
        }

        // Asaas envia o token de acesso no header asaas-access-token
        $receivedToken = $request->header('asaas-access-token', '');

        return hash_equals($accessToken, $receivedToken);
    }
}
