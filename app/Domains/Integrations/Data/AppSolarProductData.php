<?php

declare(strict_types=1);

namespace App\Domains\Integrations\Data;

use Carbon\CarbonImmutable;
use InvalidArgumentException;
use Spatie\LaravelData\Data;

/**
 * Espelho 1:1 de um produto retornado pela API do AppSolar
 * (`GET /api/v1/loja/produtos` e `GET /api/v1/loja/produtos/{sku}`).
 *
 * Nenhum campo da API é descartado: todos os atributos documentados existem aqui,
 * mesmo quando não são usados diretamente pelas colunas comerciais de `products`.
 */
final class AppSolarProductData extends Data
{
    public function __construct(
        public readonly string $sku,
        public readonly string $name,
        public readonly float $kitPowerKwp,
        public readonly ?string $voltage,
        public readonly float $costPrice,
        public readonly float $salePrice,
        public readonly bool $available,
        public readonly ?string $inverterBrand,
        public readonly ?string $inverterBrandLogo,
        public readonly ?string $inverterImage,
        public readonly ?float $inverterPowerKw,
        public readonly ?string $panelBrand,
        public readonly ?string $panelBrandLogo,
        public readonly ?string $panelImage,
        public readonly ?float $panelPowerW,
        public readonly ?string $structureType,
        public readonly string $supplierName,
        public readonly ?string $componentsHtml,
        public readonly ?string $notes,
        public readonly CarbonImmutable $updatedAt,
    ) {}

    /** @param array<string, mixed> $item */
    public static function fromApiArray(array $item): self
    {
        $sku = (string) ($item['sku'] ?? '');
        $name = (string) ($item['nome'] ?? '');

        if ($sku === '' || $name === '') {
            throw new InvalidArgumentException('Produto AppSolar sem sku ou nome: '.json_encode($item));
        }

        return new self(
            sku: $sku,
            name: $name,
            kitPowerKwp: (float) ($item['potencia_kit_kwp'] ?? 0),
            voltage: self::nullableString($item['tensao'] ?? null),
            costPrice: (float) ($item['preco_custo'] ?? 0),
            salePrice: (float) ($item['preco_venda'] ?? 0),
            available: (bool) ($item['disponivel'] ?? true),
            inverterBrand: self::nullableString($item['marca_inversor'] ?? null),
            inverterBrandLogo: self::nullableString($item['marca_inversor_logo'] ?? null),
            inverterImage: self::nullableString($item['marca_inversor_imagem'] ?? null),
            inverterPowerKw: isset($item['potencia_inversor']) ? (float) $item['potencia_inversor'] : null,
            panelBrand: self::nullableString($item['marca_painel'] ?? null),
            panelBrandLogo: self::nullableString($item['marca_painel_logo'] ?? null),
            panelImage: self::nullableString($item['marca_painel_imagem'] ?? null),
            panelPowerW: isset($item['potencia_painel']) ? (float) $item['potencia_painel'] : null,
            structureType: self::nullableString($item['estrutura'] ?? null),
            supplierName: (string) ($item['fornecedor'] ?? 'EDELTEC'),
            componentsHtml: self::nullableString($item['componentes'] ?? null),
            notes: self::nullableString($item['observacoes'] ?? null),
            updatedAt: isset($item['atualizado_em'])
                ? CarbonImmutable::parse($item['atualizado_em'])
                : CarbonImmutable::now(),
        );
    }

    private static function nullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
