<?php

declare(strict_types=1);

namespace App\Domains\Settings\Models;

use App\Domains\Catalog\Models\Category;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class MenuItem extends Model
{
    /** Páginas internas fixas que podem ser ativadas/desativadas no menu. */
    public const PAGES = [
        'kit_builder' => ['label' => 'Monte seu Kit', 'url' => '/monte-seu-kit'],
        'simulator'   => ['label' => 'Simulador', 'url' => '/simulador'],
        'blog'        => ['label' => 'Blog', 'url' => '/blog'],
    ];

    protected $fillable = [
        'label', 'type', 'category_id', 'page_key', 'url', 'position', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'position'  => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function href(): ?string
    {
        return match ($this->type) {
            'category' => $this->category ? '/categorias/'.$this->category->slug : null,
            'page'     => self::PAGES[$this->page_key]['url'] ?? null,
            'custom'   => $this->url,
            default    => null,
        };
    }
}
