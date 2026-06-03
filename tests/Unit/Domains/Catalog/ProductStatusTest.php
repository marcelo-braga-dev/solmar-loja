<?php

declare(strict_types=1);

use App\Domains\Catalog\Enums\ProductStatus;

it('has correct labels', function (): void {
    expect(ProductStatus::Draft->label())->toBe('Rascunho');
    expect(ProductStatus::Published->label())->toBe('Publicado');
    expect(ProductStatus::Archived->label())->toBe('Arquivado');
});

it('only published status is visible', function (): void {
    expect(ProductStatus::Published->isVisible())->toBeTrue();
    expect(ProductStatus::Draft->isVisible())->toBeFalse();
    expect(ProductStatus::Archived->isVisible())->toBeFalse();
});

it('has correct backing values', function (): void {
    expect(ProductStatus::Draft->value)->toBe('draft');
    expect(ProductStatus::Published->value)->toBe('published');
    expect(ProductStatus::Archived->value)->toBe('archived');
});
