<?php

declare(strict_types=1);

use App\Domains\Integrations\Exceptions\AppSolarApiException;
use App\Domains\Integrations\Exceptions\AppSolarAuthenticationException;
use App\Domains\Integrations\Services\AppSolarHttpClient;
use Illuminate\Support\Facades\Http;

beforeEach(function (): void {
    config([
        'services.appsolar.base_url' => 'https://appsolar.test/api/v1/loja',
        'services.appsolar.token' => 'test-token',
        'services.appsolar.timeout' => 5,
    ]);
});

function appSolarApiProduct(string $sku): array
{
    return [
        'sku' => $sku,
        'nome' => "Kit solar {$sku}",
        'potencia_kit_kwp' => 2.22,
        'tensao' => '220',
        'preco_custo' => 3806.31,
        'preco_venda' => 5519.15,
        'disponivel' => true,
        'marca_inversor' => 'DEYE',
        'marca_painel' => 'Jinko',
        'potencia_inversor' => 3,
        'potencia_painel' => 555,
        'estrutura' => 'Sem Estrutura',
        'fornecedor' => 'EDELTEC',
        'componentes' => '<table></table>',
        'observacoes' => null,
        'atualizado_em' => '2024-07-29T12:24:53-03:00',
    ];
}

it('paginates through all pages following links.next', function (): void {
    Http::fake([
        'appsolar.test/api/v1/loja/produtos?*page=1*' => Http::response([
            'data' => [appSolarApiProduct('SKU-1')],
            'links' => ['next' => 'https://appsolar.test/api/v1/loja/produtos?page=2'],
            'meta' => ['current_page' => 1, 'last_page' => 2],
        ], 200),
        'appsolar.test/api/v1/loja/produtos?*page=2*' => Http::response([
            'data' => [appSolarApiProduct('SKU-2')],
            'links' => ['next' => null],
            'meta' => ['current_page' => 2, 'last_page' => 2],
        ], 200),
    ]);

    $client = new AppSolarHttpClient;
    $skus = [];

    foreach ($client->fetchProducts() as $product) {
        $skus[] = $product->sku;
    }

    expect($skus)->toBe(['SKU-1', 'SKU-2']);
});

it('throws AppSolarAuthenticationException on 401', function (): void {
    Http::fake([
        'appsolar.test/*' => Http::response(['message' => 'Não autorizado.'], 401),
    ]);

    $client = new AppSolarHttpClient;

    expect(fn () => iterator_to_array($client->fetchProducts()))
        ->toThrow(AppSolarAuthenticationException::class);
});

it('findBySku returns null on 404', function (): void {
    Http::fake([
        'appsolar.test/*' => Http::response(['message' => 'Produto não encontrado.'], 404),
    ]);

    $client = new AppSolarHttpClient;

    expect($client->findBySku('INEXISTENTE'))->toBeNull();
});

it('findBySku returns mapped product on success', function (): void {
    Http::fake([
        'appsolar.test/*' => Http::response(['data' => appSolarApiProduct('SKU-9')], 200),
    ]);

    $client = new AppSolarHttpClient;
    $product = $client->findBySku('SKU-9');

    expect($product?->sku)->toBe('SKU-9');
    expect($product?->salePrice)->toBe(5519.15);
});

it('retries on 429 and succeeds on the next attempt', function (): void {
    Http::fake([
        'appsolar.test/*' => Http::sequence()
            ->push(['message' => 'Too Many Attempts.'], 429)
            ->push(['data' => appSolarApiProduct('SKU-7')], 200),
    ]);

    $client = new AppSolarHttpClient;
    $product = $client->findBySku('SKU-7');

    expect($product?->sku)->toBe('SKU-7');
});

it('throws AppSolarApiException after exhausting retries on repeated 5xx', function (): void {
    Http::fake([
        'appsolar.test/*' => Http::response(['message' => 'Internal Server Error'], 500),
    ]);

    $client = new AppSolarHttpClient;

    expect(fn () => $client->findBySku('SKU-5'))->toThrow(AppSolarApiException::class);
});
