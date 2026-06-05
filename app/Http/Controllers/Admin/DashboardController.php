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

        // ── KPIs ──────────────────────────────────────────────────────────────

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

        // Pedidos pendentes/atenção
        $pendingOrders = Order::whereIn('status', ['pending', 'awaiting_payment'])->count();

        // Produtos com estoque baixo
        $lowStockCount = DB::table('stocks')
            ->where('quantity_available', '>', 0)
            ->where('quantity_available', '<=', 5)
            ->count();

        // ── Receita diária últimos 30 dias ────────────────────────────────────

        $last30Days = collect(range(29, 0))->map(fn (int $d) => now()->subDays($d)->toDateString());

        $revenue30Raw = Order::select(
            DB::raw('DATE(placed_at) as date'),
            DB::raw('SUM(total_cents) as revenue'),
            DB::raw('COUNT(*) as orders')
        )
            ->where('status', '!=', 'canceled')
            ->where('placed_at', '>=', now()->subDays(29)->startOfDay())
            ->groupBy(DB::raw('DATE(placed_at)'))
            ->get()
            ->keyBy('date');

        $revenueChart = $last30Days->map(fn (string $date) => [
            'date'    => now()->parse($date)->format('d/m'),
            'revenue' => (int) ($revenue30Raw[$date]?->revenue ?? 0),
            'orders'  => (int) ($revenue30Raw[$date]?->orders ?? 0),
        ])->values()->all();

        // Sparkline 7 dias
        $revenueSparkline = collect(range(6, 0))->map(fn (int $d) => now()->subDays($d)->toDateString())
            ->map(fn (string $date) => (int) ($revenue30Raw[$date]?->revenue ?? 0))
            ->values()->all();

        // ── Receita por categoria (top 5) ─────────────────────────────────────

        $revenueByCategory = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('category_product', 'products.id', '=', 'category_product.product_id')
            ->join('categories', 'category_product.category_id', '=', 'categories.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', '!=', 'canceled')
            ->whereNull('categories.parent_id')
            ->whereMonth('orders.placed_at', now()->month)
            ->select('categories.name', DB::raw('SUM(order_items.total_cents) as revenue'))
            ->groupBy('categories.name')
            ->orderByDesc('revenue')
            ->limit(5)
            ->get()
            ->map(fn ($r) => ['name' => $r->name, 'value' => (int) $r->revenue]);

        // ── Top produtos ──────────────────────────────────────────────────────

        $topProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->where('orders.status', '!=', 'canceled')
            ->whereMonth('orders.placed_at', now()->month)
            ->select(
                'products.name',
                'products.uuid',
                DB::raw('SUM(order_items.quantity) as qty'),
                DB::raw('SUM(order_items.total_cents) as revenue')
            )
            ->groupBy('products.id', 'products.name', 'products.uuid')
            ->orderByDesc('revenue')
            ->limit(8)
            ->get()
            ->map(fn ($r) => [
                'name'    => $r->name,
                'uuid'    => $r->uuid,
                'qty'     => (int) $r->qty,
                'revenue' => (int) $r->revenue,
            ]);

        // ── Novos clientes últimos 7 dias ─────────────────────────────────────

        $newCustomers7 = User::role('customer')
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->count();

        $customerGrowth = DB::table('users')
            ->join('model_has_roles', 'users.id', '=', 'model_has_roles.model_id')
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('roles.name', 'customer')
            ->where('users.created_at', '>=', now()->subDays(29)->startOfDay())
            ->select(DB::raw('DATE(users.created_at) as date'), DB::raw('COUNT(*) as count'))
            ->groupBy(DB::raw('DATE(users.created_at)'))
            ->pluck('count', 'date');

        $customerChart = $last30Days->map(fn (string $date) => [
            'date'  => now()->parse($date)->format('d/m'),
            'count' => (int) ($customerGrowth[$date] ?? 0),
        ])->values()->all();

        // ── Pedidos recentes ──────────────────────────────────────────────────

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
                'new_customers_7d'    => $newCustomers7,
            ],
            'revenueChart'      => $revenueChart,
            'customerChart'     => $customerChart,
            'revenueByCategory' => $revenueByCategory,
            'topProducts'       => $topProducts,
            'recentOrders'      => $recentOrders,
        ]);
    }
}
