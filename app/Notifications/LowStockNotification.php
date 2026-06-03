<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domains\Catalog\Models\Product;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class LowStockNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Product $product,
        private readonly int $quantity,
    ) {}

    /** @return array<string> */
    public function via(mixed $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(mixed $notifiable): array
    {
        return [
            'type'        => 'low_stock',
            'title'       => 'Estoque baixo',
            'message'     => "O produto \"{$this->product->name}\" tem apenas {$this->quantity} unidade(s) em estoque.",
            'action_url'  => "/admin/inventory",
            'product_id'  => $this->product->id,
            'product_name' => $this->product->name,
            'quantity'    => $this->quantity,
        ];
    }
}
