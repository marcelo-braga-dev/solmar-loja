<?php

declare(strict_types=1);

use App\Domains\Integrations\Data\AppSolarProductData;

function appSolarApiItem(array $overrides = []): array
{
    return array_merge([
        'sku' => '278327',
        'nome' => 'Gerador solar deye 2,22 kwp mon. 220v s/estrutura (3k/555w)',
        'potencia_kit_kwp' => 2.22,
        'tensao' => '220',
        'preco_custo' => 3806.31,
        'preco_venda' => 5519.15,
        'disponivel' => true,
        'marca_inversor' => 'DEYE (Convencional)',
        'marca_inversor_logo' => 'https://appsolar.test/storage/produtos/inversor-logo.jpg',
        'marca_inversor_imagem' => 'https://appsolar.test/storage/produtos/inversor.jpg',
        'potencia_inversor' => 3,
        'marca_painel' => 'Jinko',
        'marca_painel_logo' => 'https://appsolar.test/storage/produtos/painel-logo.jpg',
        'marca_painel_imagem' => 'https://appsolar.test/storage/produtos/painel.png',
        'potencia_painel' => 555,
        'estrutura' => 'Sem Estrutura',
        'fornecedor' => 'EDELTEC',
        'componentes' => '<table><tr><th>Sku</th></tr></table>',
        'observacoes' => null,
        'atualizado_em' => '2024-07-29T12:24:53-03:00',
    ], $overrides);
}

it('maps every field from the api payload', function (): void {
    $data = AppSolarProductData::fromApiArray(appSolarApiItem());

    expect($data->sku)->toBe('278327');
    expect($data->name)->toBe('Gerador solar deye 2,22 kwp mon. 220v s/estrutura (3k/555w)');
    expect($data->kitPowerKwp)->toBe(2.22);
    expect($data->voltage)->toBe('220');
    expect($data->costPrice)->toBe(3806.31);
    expect($data->salePrice)->toBe(5519.15);
    expect($data->available)->toBeTrue();
    expect($data->inverterBrand)->toBe('DEYE (Convencional)');
    expect($data->inverterBrandLogo)->toBe('https://appsolar.test/storage/produtos/inversor-logo.jpg');
    expect($data->inverterImage)->toBe('https://appsolar.test/storage/produtos/inversor.jpg');
    expect($data->inverterPowerKw)->toBe(3.0);
    expect($data->panelBrand)->toBe('Jinko');
    expect($data->panelBrandLogo)->toBe('https://appsolar.test/storage/produtos/painel-logo.jpg');
    expect($data->panelImage)->toBe('https://appsolar.test/storage/produtos/painel.png');
    expect($data->panelPowerW)->toBe(555.0);
    expect($data->structureType)->toBe('Sem Estrutura');
    expect($data->supplierName)->toBe('EDELTEC');
    expect($data->componentsHtml)->toBe('<table><tr><th>Sku</th></tr></table>');
    expect($data->notes)->toBeNull();
    expect($data->updatedAt->toIso8601String())->toBe('2024-07-29T12:24:53-03:00');
});

it('treats nullable brand and image fields gracefully', function (): void {
    $data = AppSolarProductData::fromApiArray(appSolarApiItem([
        'marca_inversor' => null,
        'marca_inversor_logo' => null,
        'marca_inversor_imagem' => null,
        'potencia_inversor' => null,
        'observacoes' => 'Produto em promoção',
    ]));

    expect($data->inverterBrand)->toBeNull();
    expect($data->inverterBrandLogo)->toBeNull();
    expect($data->inverterImage)->toBeNull();
    expect($data->inverterPowerKw)->toBeNull();
    expect($data->notes)->toBe('Produto em promoção');
});

it('throws when sku is missing', function (): void {
    AppSolarProductData::fromApiArray(appSolarApiItem(['sku' => '']));
})->throws(InvalidArgumentException::class);

it('throws when name is missing', function (): void {
    AppSolarProductData::fromApiArray(appSolarApiItem(['nome' => '']));
})->throws(InvalidArgumentException::class);

it('defaults supplier name to EDELTEC when absent', function (): void {
    $item = appSolarApiItem();
    unset($item['fornecedor']);

    $data = AppSolarProductData::fromApiArray($item);

    expect($data->supplierName)->toBe('EDELTEC');
});
