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
            $payload = $request->all();
            $eventType = $payload['type'] ?? $payload['topic'] ?? $payload['event'] ?? 'unknown';
            $eventId = $payload['data']['id'] ?? $payload['id'] ?? $payload['payment']['id'] ?? uniqid('evt_');

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
            'mercadopago' => $this->verifyMercadoPago($request),
            'mock' => true,
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

    private function verifyMercadoPago(Request $request): bool
    {
        $secret = config('services.mercadopago.webhook_secret', '');

        if (empty($secret)) {
            return true;
        }

        $signatureHeader = $request->header('x-signature', '');
        $requestId = $request->header('x-request-id', '');

        if (empty($signatureHeader)) {
            return false;
        }

        $parts = [];
        foreach (explode(',', $signatureHeader) as $part) {
            [$key, $value] = array_pad(explode('=', $part, 2), 2, null);

            if ($key !== null) {
                $parts[trim($key)] = trim((string) $value);
            }
        }

        $ts = $parts['ts'] ?? '';
        $hash = $parts['v1'] ?? '';

        if ($ts === '' || $hash === '') {
            return false;
        }

        $dataId = $this->extractDataIdFromQuery($request);
        $manifest = "id:{$dataId};request-id:{$requestId};ts:{$ts};";
        $computed = hash_hmac('sha256', $manifest, $secret);

        return hash_equals($computed, $hash);
    }

    /**
     * O Mercado Pago manda o id do recurso como "data.id" na query string.
     * O PHP converte pontos em nomes de chave para "_" ao popular $_GET, então
     * $request->query('data.id') nunca encontra o valor real — é preciso ler a
     * query string bruta para extrair a chave com o ponto literal.
     */
    private function extractDataIdFromQuery(Request $request): string
    {
        $queryString = (string) $request->server('QUERY_STRING', '');

        if (preg_match('/(?:^|&)data\.id=([^&]*)/', $queryString, $matches) === 1) {
            return urldecode($matches[1]);
        }

        return (string) ($request->query('id') ?? '');
    }
}
