<?php

declare(strict_types=1);

use App\Domains\Integrations\Support\HtmlSanitizer;

it('returns null for empty or null html', function (): void {
    expect(HtmlSanitizer::sanitizeTable(null))->toBeNull();
    expect(HtmlSanitizer::sanitizeTable(''))->toBeNull();
    expect(HtmlSanitizer::sanitizeTable('   '))->toBeNull();
});

it('keeps allowed table structure', function (): void {
    $html = '<table><tr><th>Sku</th><th>Quantidade</th></tr><tr><td>123</td><td>2</td></tr></table>';

    $sanitized = HtmlSanitizer::sanitizeTable($html);

    expect($sanitized)->toContain('<table>');
    expect($sanitized)->toContain('<th>Sku</th>');
    expect($sanitized)->toContain('<td>123</td>');
});

it('strips script tags entirely', function (): void {
    $html = '<table><tr><td>Item</td></tr></table><script>alert(1)</script>';

    $sanitized = HtmlSanitizer::sanitizeTable($html);

    expect($sanitized)->not->toContain('<script>');
    expect($sanitized)->not->toContain('alert(1)');
});

it('removes event handler and style attributes from allowed tags', function (): void {
    $html = '<table onmouseover="alert(1)"><tr><td style="color:red" onclick="evil()">Item</td></tr></table>';

    $sanitized = HtmlSanitizer::sanitizeTable($html);

    expect($sanitized)->not->toContain('onmouseover');
    expect($sanitized)->not->toContain('onclick');
    expect($sanitized)->not->toContain('style=');
    expect($sanitized)->toContain('Item');
});

it('unwraps disallowed tags but keeps their text content', function (): void {
    $html = '<table><tr><td><iframe src="evil.com"></iframe>Item</td></tr></table>';

    $sanitized = HtmlSanitizer::sanitizeTable($html);

    expect($sanitized)->not->toContain('<iframe');
    expect($sanitized)->toContain('Item');
});
