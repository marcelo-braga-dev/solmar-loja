<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domains\Orders\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class NewOrderNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Order $order) {}

    /** @return array<string> */
    public function via(mixed $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(mixed $notifiable): array
    {
        return [
            'type'       => 'new_order',
            'title'      => 'Novo pedido recebido',
            'message'    => "Pedido #{$this->order->uuid} no valor de R$ " . number_format($this->order->total_cents / 100, 2, ',', '.'),
            'action_url' => "/admin/orders/{$this->order->uuid}",
            'order_uuid' => $this->order->uuid,
            'total'      => $this->order->total_cents,
        ];
    }
}
