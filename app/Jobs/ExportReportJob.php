<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Domains\Financial\Services\FinancialService;
use App\Domains\Orders\Enums\OrderStatus;
use App\Domains\Orders\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

final class ExportReportJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $timeout  = 300;
    public int $tries    = 2;

    public function __construct(
        private readonly string $type,
        private readonly string $startDate,
        private readonly string $endDate,
        private readonly int $adminUserId,
    ) {
        $this->onQueue('default');
    }

    public function handle(FinancialService $financialService): void
    {
        $start    = Carbon::parse($this->startDate)->startOfDay();
        $end      = Carbon::parse($this->endDate)->endOfDay();
        $filename = "exports/report_{$this->type}_{$this->startDate}_{$this->endDate}.csv";

        $csv = match ($this->type) {
            'dre'    => $this->buildDreCsv($financialService, $start, $end),
            'orders' => $this->buildOrdersCsv($start, $end),
            default  => $this->buildOrdersCsv($start, $end),
        };

        Storage::disk('public')->put($filename, $csv);

        Log::info("Report exported", ['file' => $filename, 'admin' => $this->adminUserId]);
    }

    private function buildDreCsv(FinancialService $service, Carbon $start, Carbon $end): string
    {
        $dre  = $service->dre($start, $end);
        $rows = [
            ['Demonstrativo de Resultado do Exercício'],
            ['Período', "{$dre['period']['start']} a {$dre['period']['end']}"],
            [],
            ['RECEITAS', '', ''],
            ['Receita Bruta', '', number_format($dre['gross_revenue'] / 100, 2, ',', '.')],
            [],
            ['DESPESAS', '', ''],
            ['Total de Despesas', '', number_format($dre['total_expenses'] / 100, 2, ',', '.')],
            [],
            ['RESULTADO LÍQUIDO', '', number_format($dre['net_result'] / 100, 2, ',', '.')],
        ];

        return $this->arrayToCsv($rows);
    }

    private function buildOrdersCsv(Carbon $start, Carbon $end): string
    {
        $rows = [['UUID', 'Status', 'Cliente', 'Total (R$)', 'Data']];

        Order::whereBetween('placed_at', [$start, $end])
            ->whereNotIn('status', [OrderStatus::Canceled->value, OrderStatus::Refunded->value])
            ->with('user:id,name,email')
            ->orderBy('placed_at')
            ->chunk(500, function ($orders) use (&$rows): void {
                foreach ($orders as $order) {
                    $rows[] = [
                        $order->uuid,
                        $order->status,
                        $order->user?->name ?? 'Anônimo',
                        number_format($order->total_cents / 100, 2, ',', '.'),
                        $order->placed_at?->format('d/m/Y H:i') ?? '',
                    ];
                }
            });

        return $this->arrayToCsv($rows);
    }

    /** @param array<int, array<int, string>> $rows */
    private function arrayToCsv(array $rows): string
    {
        $handle = fopen('php://memory', 'r+');
        foreach ($rows as $row) {
            fputcsv($handle, $row, ';');
        }
        rewind($handle);

        return (string) stream_get_contents($handle);
    }
}
