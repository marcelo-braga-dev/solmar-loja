<?php

declare(strict_types=1);

namespace App\Domains\Integrations\Services;

use App\Domains\Inventory\Contracts\ErpClientInterface;
use App\Domains\Inventory\Data\ErpProductData;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Cliente HTTP genérico para ERP/Distribuidor.
 *
 * Configurar no .env:
 *   ERP_BASE_URL=https://api.seu-distribuidor.com.br
 *   ERP_API_KEY=your_api_key
 *   ERP_TIMEOUT=30
 *
 * Adapte os métodos de mapeamento para o formato da API do seu distribuidor.
 */
final class HttpErpClient implements ErpClientInterface
{
    private const CACHE_TTL = 300; // 5 minutos

    /** Edeltec não retorna quantidade de estoque, apenas o flag "disponivel". */
    private const AVAILABLE_STOCK_PLACEHOLDER = 999;

    public function name(): string
    {
        return 'http_erp';
    }

    public function isAvailable(): bool
    {
        $cacheKey = 'erp_available';

        return Cache::remember($cacheKey, 60, function (): bool {
            try {
                $response = $this->http()->get('/produtos', ['per_page' => 1]);

                return $response->successful();
            } catch (\Throwable) {
                return false;
            }
        });
    }

    /** @return Collection<int, ErpProductData> */
    public function fetchProducts(): Collection
    {
        $cacheKey = 'erp_products_all';

        return Cache::remember($cacheKey, self::CACHE_TTL, function (): Collection {
            $products = collect();
            $page     = 1;

            do {
                try {
                    $response = $this->http()->get('/produtos', [
                        'page'     => $page,
                        'per_page' => 100,
                    ]);

                    $response->throw();

                    $data = $response->json();

                    $items = $this->extractItems($data);

                    foreach ($items as $item) {
                        $mapped = $this->mapProduct($item);

                        if ($mapped !== null) {
                            $products->push($mapped);
                        }
                    }

                    $hasMore = $this->hasMorePages($data, $page);
                    $page++;
                } catch (RequestException $e) {
                    Log::error('ERP fetchProducts failed', [
                        'page'  => $page,
                        'error' => $e->getMessage(),
                    ]);
                    break;
                }
            } while ($hasMore);

            return $products;
        });
    }

    private function http(): \Illuminate\Http\Client\PendingRequest
    {
        $apiKey  = config('services.erp.api_key', '');
        $baseUrl = config('services.erp.base_url', '');
        $timeout = (int) config('services.erp.timeout', 30);

        return Http::baseUrl($baseUrl)
            ->timeout($timeout)
            ->retry(2, 500)
            ->withHeaders([
                'Authorization' => "Bearer {$apiKey}",
                'Accept'        => 'application/json',
                'Content-Type'  => 'application/json',
            ]);
    }

    /**
     * Extrai a lista de produtos da resposta.
     * Adapte conforme o formato da API do seu distribuidor.
     *
     * @param array<string, mixed> $response
     * @return array<int, array<string, mixed>>
     */
    private function extractItems(array $response): array
    {
        return $response['data'] ?? $response['items'] ?? $response['products'] ?? $response;
    }

    /**
     * Verifica se há mais páginas para buscar.
     *
     * @param array<string, mixed> $response
     */
    private function hasMorePages(array $response, int $currentPage): bool
    {
        $total   = $response['meta']['total'] ?? $response['total'] ?? null;
        $perPage = $response['meta']['per_page'] ?? 100;

        if ($total === null) {
            return ! empty($response['data']);
        }

        return $currentPage * $perPage < $total;
    }

    /**
     * Mapeia um produto da API do distribuidor para ErpProductData.
     * ADAPTE este método para o formato da API do seu distribuidor.
     *
     * @param array<string, mixed> $item
     */
    private function mapProduct(array $item): ?ErpProductData
    {
        $externalId = (string) ($item['id'] ?? $item['codigo'] ?? $item['sku'] ?? '');
        $sku        = (string) ($item['sku'] ?? $item['codigo'] ?? $externalId);
        $name       = (string) ($item['name'] ?? $item['nome'] ?? $item['descricao'] ?? '');

        if ($externalId === '' || $name === '') {
            return null;
        }

        // Preço: aceita centavos (int) ou reais (float)
        $rawPrice = $item['price'] ?? $item['preco'] ?? $item['preco_venda'] ?? $item['valor'] ?? 0;
        $priceCents = is_float($rawPrice) || (is_string($rawPrice) && str_contains($rawPrice, '.'))
            ? (int) round((float) $rawPrice * 100)
            : (int) $rawPrice;

        $rawCompare = $item['compare_price'] ?? $item['preco_de'] ?? null;
        $compareCents = $rawCompare !== null
            ? (is_float($rawCompare) ? (int) round((float) $rawCompare * 100) : (int) $rawCompare)
            : null;

        // Edeltec não informa quantidade real, apenas o flag booleano "disponivel"
        $stock = array_key_exists('disponivel', $item)
            ? ((bool) $item['disponivel'] ? self::AVAILABLE_STOCK_PLACEHOLDER : 0)
            : (int) ($item['stock'] ?? $item['estoque'] ?? $item['quantidade'] ?? 0);

        $specifications = array_filter([
            'Potência do Kit'     => isset($item['potencia_kit_kwp']) ? $item['potencia_kit_kwp'].' kWp' : null,
            'Tensão'              => $item['tensao'] ?? null,
            'Marca do Inversor'   => $item['marca_inversor'] ?? null,
            'Potência do Inversor' => isset($item['potencia_inversor']) ? $item['potencia_inversor'].' kW' : null,
            'Marca do Painel'     => $item['marca_painel'] ?? null,
            'Potência do Painel'  => isset($item['potencia_painel']) ? $item['potencia_painel'].' W' : null,
            'Estrutura'           => $item['estrutura'] ?? null,
            'Fornecedor'          => $item['fornecedor'] ?? null,
        ], fn ($value) => $value !== null);

        $categoryName = $item['categoria'] ?? $item['category'] ?? $item['categoria_nome'] ?? null;

        // Álbum de fotos reais do kit — a primeira imagem é a capa do produto
        $albumUrls = collect($item['imagens'] ?? [])
            ->sortByDesc(fn ($img) => (bool) ($img['principal'] ?? false))
            ->pluck('url')
            ->filter()
            ->values()
            ->all();

        // Demais imagens (painel, inversor e logos das marcas) entram na galeria depois do álbum
        $imageUrls = array_values(array_unique(array_filter([
            ...$albumUrls,
            $item['image_url'] ?? null,
            $item['imagem'] ?? null,
            $item['marca_painel_imagem'] ?? null,
            $item['marca_inversor_imagem'] ?? null,
            $item['marca_painel_logo'] ?? null,
            $item['marca_inversor_logo'] ?? null,
        ])));

        return new ErpProductData(
            externalId: $externalId,
            sku: $sku,
            name: $name,
            priceCents: $priceCents,
            stockQuantity: $stock,
            compareAtPriceCents: $compareCents,
            weightGrams: isset($item['weight']) ? (int) ($item['weight'] * 1000) : null,
            description: $item['description'] ?? $item['descricao_completa'] ?? $item['observacoes'] ?? null,
            specifications: $specifications !== [] ? $specifications : null,
            imageUrls: $imageUrls,
            categoryName: is_string($categoryName) && $categoryName !== '' ? $categoryName : null,
        );
    }
}
