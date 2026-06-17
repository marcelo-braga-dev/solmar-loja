<?php

declare(strict_types=1);

namespace App\Domains\Integrations\Services;

use App\Domains\Integrations\Contracts\AppSolarClientInterface;
use App\Domains\Integrations\Data\AppSolarProductData;
use App\Domains\Integrations\Exceptions\AppSolarApiException;
use App\Domains\Integrations\Exceptions\AppSolarAuthenticationException;
use Carbon\CarbonInterface;
use Generator;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP para a API de Sincronização de Produtos do AppSolar (distribuidor Edeltec).
 *
 * Endpoints consumidos:
 *   GET {APPSOLAR_API_BASE_URL}/produtos             — listagem paginada (per_page, atualizados_desde, page)
 *   GET {APPSOLAR_API_BASE_URL}/produtos/{sku}        — produto único
 *
 * Autenticação: Bearer token estático (APPSOLAR_API_TOKEN), sem expiração/renovação.
 * Rate limit do AppSolar: 60 requisições/minuto — por isso espaçamos as páginas
 * (ver THROTTLE_MICROSECONDS) e fazemos retry com backoff exponencial em 429/5xx.
 */
final class AppSolarHttpClient implements AppSolarClientInterface
{
    private const PER_PAGE = 200;

    private const MAX_ATTEMPTS = 3;

    /** Intervalo entre páginas para nunca aproximar do limite de 60 req/min. */
    private const THROTTLE_MICROSECONDS = 1_100_000;

    /** @return Generator<int, AppSolarProductData> */
    public function fetchProducts(?CarbonInterface $updatedSince = null): Generator
    {
        $page = 1;

        while (true) {
            if ($page > 1) {
                usleep(self::THROTTLE_MICROSECONDS);
            }

            $query = [
                'per_page' => self::PER_PAGE,
                'page' => $page,
            ];

            if ($updatedSince !== null) {
                $query['atualizados_desde'] = $updatedSince->toIso8601String();
            }

            $json = $this->request('/produtos', $query);
            $items = $json['data'] ?? [];

            foreach ($items as $item) {
                yield AppSolarProductData::fromApiArray($item);
            }

            $hasNext = ! empty($json['links']['next'] ?? null);

            if (! $hasNext || $items === []) {
                break;
            }

            $page++;
        }
    }

    public function findBySku(string $sku): ?AppSolarProductData
    {
        try {
            $json = $this->request('/produtos/'.rawurlencode($sku), []);
        } catch (AppSolarApiException $e) {
            if ($e->getCode() === 404) {
                return null;
            }

            throw $e;
        }

        return isset($json['data']) ? AppSolarProductData::fromApiArray($json['data']) : null;
    }

    private function httpClient(): PendingRequest
    {
        $baseUrl = (string) config('services.appsolar.base_url', '');
        $token = (string) config('services.appsolar.token', '');
        $timeout = (int) config('services.appsolar.timeout', 30);

        return Http::baseUrl($baseUrl)
            ->timeout($timeout)
            ->withToken($token)
            ->acceptJson();
    }

    /**
     * Executa a requisição com retry/backoff exponencial para 429 e 5xx,
     * e falha imediata (sem retry) para 401/404/422 — conforme documentado pelo AppSolar.
     *
     * @param  array<string, mixed>  $query
     * @return array<string, mixed>
     */
    private function request(string $path, array $query): array
    {
        $attempt = 0;

        while (true) {
            $attempt++;

            try {
                $response = $this->httpClient()->get($path, $query);
            } catch (ConnectionException $e) {
                if ($attempt >= self::MAX_ATTEMPTS) {
                    throw new AppSolarApiException(
                        "Falha de conexão com a API do AppSolar após {$attempt} tentativas: {$e->getMessage()}",
                        previous: $e,
                    );
                }

                Log::warning('AppSolar API connection error, retrying', ['attempt' => $attempt, 'path' => $path]);
                usleep($this->backoffMicroseconds($attempt));

                continue;
            }

            if ($response->status() === 401) {
                throw new AppSolarAuthenticationException(
                    'Token inválido ou ausente (HTTP 401) ao acessar a API do AppSolar. Verifique APPSOLAR_API_TOKEN.'
                );
            }

            if ($response->status() === 404) {
                throw new AppSolarApiException("Recurso não encontrado na API do AppSolar: {$path}", 404);
            }

            if ($response->status() === 422) {
                throw new AppSolarApiException(
                    "Parâmetros inválidos ao consultar a API do AppSolar ({$path}): {$response->body()}",
                    422,
                );
            }

            if ($response->status() === 429 || $response->serverError()) {
                if ($attempt >= self::MAX_ATTEMPTS) {
                    throw new AppSolarApiException(
                        "API do AppSolar indisponível após {$attempt} tentativas (HTTP {$response->status()}) em {$path}.",
                        $response->status(),
                    );
                }

                Log::warning('AppSolar API retryable error', [
                    'attempt' => $attempt,
                    'status' => $response->status(),
                    'path' => $path,
                ]);
                usleep($this->backoffMicroseconds($attempt));

                continue;
            }

            if ($response->failed()) {
                throw new AppSolarApiException(
                    "Erro inesperado da API do AppSolar (HTTP {$response->status()}) em {$path}: {$response->body()}",
                    $response->status(),
                );
            }

            return $response->json() ?? [];
        }
    }

    private function backoffMicroseconds(int $attempt): int
    {
        return 1_000_000 * (2 ** ($attempt - 1)); // 1s, 2s, 4s...
    }
}
