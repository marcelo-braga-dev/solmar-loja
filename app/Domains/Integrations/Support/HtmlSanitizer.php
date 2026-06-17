<?php

declare(strict_types=1);

namespace App\Domains\Integrations\Support;

use DOMDocument;
use DOMElement;
use DOMNode;

/**
 * Sanitiza HTML simples (tabela de componentes do kit) recebido de uma fonte externa
 * antes de persistir/exibir, removendo tags e atributos fora da whitelist —
 * evita XSS caso o HTML do AppSolar venha malformado ou comprometido.
 */
final class HtmlSanitizer
{
    /** @var string[] */
    private const ALLOWED_TAGS = [
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption',
        'colgroup', 'col', 'br', 'b', 'strong', 'i', 'em', 'span', 'p', 'ul', 'ol', 'li',
    ];

    public static function sanitizeTable(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return null;
        }

        $dom = new DOMDocument;
        libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<?xml encoding="utf-8" ?><div>'.$html.'</div>',
            LIBXML_NOERROR | LIBXML_NOWARNING
        );
        libxml_clear_errors();

        $wrapper = $dom->getElementsByTagName('div')->item(0);

        if ($wrapper === null) {
            return null;
        }

        self::stripDisallowed($wrapper);

        $sanitized = '';
        foreach (iterator_to_array($wrapper->childNodes) as $child) {
            $sanitized .= $dom->saveHTML($child);
        }

        $sanitized = trim($sanitized);

        return $sanitized === '' ? null : $sanitized;
    }

    private static function stripDisallowed(DOMNode $node): void
    {
        foreach (iterator_to_array($node->childNodes) as $child) {
            if (! $child instanceof DOMElement) {
                continue;
            }

            // Remove todos os atributos (sem estilos inline, sem on*, sem href/src).
            foreach (iterator_to_array($child->attributes ?? []) as $attribute) {
                $child->removeAttribute($attribute->name);
            }

            self::stripDisallowed($child);

            if (! in_array(strtolower($child->tagName), self::ALLOWED_TAGS, true)) {
                while ($child->firstChild !== null) {
                    $node->insertBefore($child->firstChild, $child);
                }
                $node->removeChild($child);
            }
        }
    }
}
