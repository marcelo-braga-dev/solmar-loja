<?php

declare(strict_types=1);

namespace App\Domains\Financial\Services;

use App\Domains\Financial\Models\Transaction;
use App\Domains\Orders\Models\Order;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

final class FinancialService
{
    public function createFromOrder(Order $order): Transaction
    {
        return Transaction::create([
            'type'         => 'revenue',
            'category'     => 'product_sale',
            'amount_cents' => $order->total_cents,
            'order_id'     => $order->id,
            'description'  => "Pedido #{$order->uuid}",
            'date'         => $order->placed_at ?? now(),
            'status'       => 'confirmed',
            'reference'    => $order->uuid,
        ]);
    }

    /** @return array<string, mixed> */
    public function dre(Carbon $start, Carbon $end): array
    {
        $revenue = Transaction::where('type', 'revenue')
            ->whereBetween('date', [$start, $end])
            ->where('status', '!=', 'pending')
            ->sum('amount_cents');

        $expenses = Transaction::where('type', 'expense')
            ->whereBetween('date', [$start, $end])
            ->where('status', '!=', 'pending')
            ->sum('amount_cents');

        $byCategory = Transaction::whereBetween('date', [$start, $end])
            ->select('type', 'category', DB::raw('SUM(amount_cents) as total'))
            ->groupBy('type', 'category')
            ->get()
            ->groupBy('type');

        return [
            'period'       => ['start' => $start->toDateString(), 'end' => $end->toDateString()],
            'gross_revenue' => $revenue,
            'total_expenses' => $expenses,
            'net_result'   => $revenue - $expenses,
            'by_category'  => $byCategory,
        ];
    }

    /** @return Collection<int, array<string, mixed>> */
    public function cashFlow(int $daysAhead = 30): Collection
    {
        $confirmed = Transaction::where('status', 'confirmed')
            ->where('date', '>=', now()->subDays(30))
            ->where('date', '<=', now()->addDays($daysAhead))
            ->select('date', 'type', DB::raw('SUM(amount_cents) as total'))
            ->groupBy('date', 'type')
            ->orderBy('date')
            ->get()
            ->groupBy('date');

        return $confirmed;
    }
}
