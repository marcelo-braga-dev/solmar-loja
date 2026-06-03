<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Models\Product;
use App\Domains\Orders\Models\Order;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        $today        = now()->startOfDay();
        $thisMonth    = now()->startOfMonth();
        $lastMonth    = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();

        $revenueThisMonth = Order::where('status', '!=', 'canceled')
            ->whereBetween('placed_at', [$thisMonth, now()])
            ->sum('total_cents');

        $revenueLastMonth = Order::where('status', '!=', 'canceled')
            ->whereBetween('placed_at', [$lastMonth, $lastMonthEnd])
            ->sum('total_cents');

        $ordersThisMonth = Order::whereBetween('placed_at', [$thisMonth, now()])->count();
        $ordersToday     = Order::where('placed_at', '>=', $today)->count();

        $ordersByStatus = Order::select('status', DB::raw('count(*) as count'))
            ->whereMonth('placed_at', now()->month)
            ->groupBy('status')
            ->pluck('count', 'status');

        // Receita dos últimos 7 dias para sparkline
        $last7Days = collect(range(6, 0))->map(fn (int $d) => now()->subDays($d)->toDateString());
        $revenueLast7Raw = Order::select(
            DB::raw('DATE(placed_at) as date'),
            DB::raw('SUM(total_cents) as revenue')
        )
            ->where('status', '!=', 'canceled')
            ->where('placed_at', '>=', now()->subDays(6)->startOfDay())
            ->groupBy(DB::raw('DATE(placed_at)'))
            ->pluck('revenue', 'date');

        $revenueSparkline = $last7Days->map(fn (string $date) => (int) ($revenueLast7Raw[$date] ?? 0))->values()->all();

        // Pedidos pendentes/atenção
        $pendingOrders = Order::whereIn('status', ['pending', 'awaiting_payment'])->count();

        // Produtos com estoque baixo (disponível entre 1 e 5 unidades)
        $lowStockCount = DB::table('stocks')
            ->where('quantity_available', '>', 0)
            ->where('quantity_available', '<=', 5)
            ->count();

        $recentOrders = Order::with('user')
            ->latest('placed_at')
            ->limit(7)
            ->get()
            ->map(fn (Order $o) => [
                'uuid'         => $o->uuid,
                'status'       => $o->status->value,
                'status_label' => $o->status->label(),
                'status_color' => $o->status->color(),
                'total_cents'  => $o->total_cents,
                'customer'     => $o->user?->name ?? 'Visitante',
                'placed_at'    => $o->placed_at?->diffForHumans(),
            ]);

        return Inertia::render('Admin/Dashboard', [
            'stats' => [
                'revenue_this_month'  => $revenueThisMonth,
                'revenue_last_month'  => $revenueLastMonth,
                'revenue_growth'      => $revenueLastMonth > 0
                    ? round(($revenueThisMonth - $revenueLastMonth) / $revenueLastMonth * 100, 1)
                    : null,
                'orders_this_month'   => $ordersThisMonth,
                'orders_today'        => $ordersToday,
                'total_products'      => Product::published()->count(),
                'total_customers'     => User::role('customer')->count(),
                'orders_by_status'    => $ordersByStatus,
                'revenue_sparkline'   => $revenueSparkline,
                'pending_orders'      => $pendingOrders,
                'low_stock_count'     => $lowStockCount,
            ],
            'recentOrders' => $recentOrders,
        ]);
    }
}
