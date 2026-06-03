<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Domains\Payments\Models\Payment;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

final class PaymentFailedNotification extends Notification
{
    use Queueable;

    public function __construct(private readonly Payment $payment) {}

    /** @return array<string> */
    public function via(mixed $notifiable): array
    {
        return ['database'];
    }

    /** @return array<string, mixed> */
    public function toArray(mixed $notifiable): array
    {
        return [
            'type'       => 'payment_failed',
            'title'      => 'Pagamento falhou',
            'message'    => "Pagamento do pedido #{$this->payment->order->uuid} falhou ({$this->payment->method->value}).",
            'action_url' => "/admin/orders/{$this->payment->order->uuid}",
            'payment_id' => $this->payment->id,
        ];
    }
}
