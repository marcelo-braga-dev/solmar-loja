<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Financial\Services\FinancialService;
use App\Domains\Orders\Enums\OrderStatus;
use App\Domains\Orders\Models\Order;
use App\Http\Controllers\Controller;
use App\Jobs\ExportReportJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

final class ReportController extends Controller
{
    public function __construct(private readonly FinancialService $financialService) {}

    public function index(Request $request): Response
    {
        $period = $request->string('period')->value() ?: 'month';
        $start  = match ($period) {
            'week'  => now()->startOfWeek(),
            'month' => now()->startOfMonth(),
            'year'  => now()->startOfYear(),
            default => now()->startOfMonth(),
        };

        $revenueByDay = Order::where('placed_at', '>=', now()->subDays(30))
            ->whereNotIn('status', [OrderStatus::Canceled->value, OrderStatus::Refunded->value])
            ->select(DB::raw('DATE(placed_at) as date'), DB::raw('SUM(total_cents) as revenue'), DB::raw('COUNT(*) as orders'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->map(fn ($row) => [
                'date'    => $row->date,
                'revenue' => $row->revenue,
                'orders'  => $row->orders,
            ]);

        $topProducts = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->whereNotIn('orders.status', [OrderStatus::Canceled->value, OrderStatus::Refunded->value])
            ->where('orders.placed_at', '>=', $start)
            ->select('order_items.name', DB::raw('SUM(order_items.quantity) as qty'), DB::raw('SUM(order_items.total_cents) as revenue'))
            ->groupBy('order_items.name')
            ->orderByDesc('revenue')
            ->limit(10)
            ->get();

        $kpis = Order::where('placed_at', '>=', $start)
            ->whereNotIn('status', [OrderStatus::Canceled->value, OrderStatus::Refunded->value])
            ->selectRaw('COUNT(*) as orders_count, SUM(total_cents) as revenue, AVG(total_cents) as avg_ticket')
            ->first();

        $canceledCount = Order::where('placed_at', '>=', $start)
            ->where('status', OrderStatus::Canceled->value)
            ->count();

        return Inertia::render('Admin/Reports/Index', [
            'period'      => $period,
            'kpis'        => [
                'revenue'        => (int) ($kpis->revenue ?? 0),
                'orders_count'   => (int) ($kpis->orders_count ?? 0),
                'avg_ticket'     => (int) ($kpis->avg_ticket ?? 0),
                'canceled_count' => $canceledCount,
            ],
            'revenueByDay' => $revenueByDay,
            'topProducts'  => $topProducts,
            'dre'          => $this->financialService->dre($start, now()),
        ]);
    }

    public function dre(Request $request): JsonResponse
    {
        $start = Carbon::parse($request->string('start')->value() ?: now()->startOfMonth()->toDateString());
        $end   = Carbon::parse($request->string('end')->value() ?: now()->toDateString());

        return response()->json($this->financialService->dre($start, $end));
    }

    public function exportCsv(Request $request): RedirectResponse
    {
        $request->validate([
            'type'  => ['required', 'in:orders,dre'],
            'start' => ['required', 'date'],
            'end'   => ['required', 'date', 'after_or_equal:start'],
        ]);

        ExportReportJob::dispatch(
            $request->string('type')->value(),
            $request->string('start')->value(),
            $request->string('end')->value(),
            $request->user()->id,
        );

        return back()->with('success', 'Exportação iniciada. O arquivo estará disponível em breve na pasta exports/.');
    }

    public function downloadExport(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse|RedirectResponse
    {
        $request->validate(['file' => ['required', 'string']]);

        $path = 'exports/' . basename($request->string('file')->value());

        if (! Storage::disk('public')->exists($path)) {
            return back()->with('error', 'Arquivo não encontrado.');
        }

        return Storage::disk('public')->download($path);
    }
}
