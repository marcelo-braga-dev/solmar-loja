<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

final class ProductImportController extends Controller
{
    public function index(): InertiaResponse
    {
        $recentImports = DB::table('sync_logs')
            ->where('source', 'csv_import')
            ->orderByDesc('started_at')
            ->limit(10)
            ->get()
            ->map(fn ($log) => [
                'id'            => $log->id,
                'status'        => $log->status,
                'total_items'   => $log->total_items,
                'created_items' => $log->created_items,
                'updated_items' => $log->updated_items,
                'error_items'   => $log->error_items,
                'errors'        => $log->errors ? json_decode($log->errors, true) : null,
                'started_at'    => $log->started_at
                    ? \Carbon\Carbon::parse($log->started_at)->format('d/m/Y H:i')
                    : null,
            ]);

        return Inertia::render('Admin/Products/Import', [
            'recentImports' => $recentImports,
        ]);
    }

    public function template(): Response
    {
        $headers = [
            'SKU',
            'Nome',
            'Descricao_curta',
            'Descricao_completa',
            'Preco_venda_reais',
            'Preco_de_reais',
            'Custo_reais',
            'Status',
            'Marca',
            'Categoria_slug',
            'Peso_gramas',
            'Estoque',
            'Destaque',
            'Meta_titulo',
            'Meta_descricao',
        ];

        $example = [
            'SKU001',
            'Painel Solar 550W Monocristalino',
            'Módulo solar de alta eficiência para sistemas residenciais.',
            'Descrição técnica completa do produto...',
            '899.90',
            '1099.90',
            '584.93',
            'published',
            'Canadian Solar',
            'paineis-modulos-solares',
            '27800',
            '50',
            '1',
            'Painel Solar 550W | SolarHub',
            'Compre painel solar 550W monocristalino com frete grátis.',
        ];

        $csv = implode(',', array_map(fn ($h) => "\"{$h}\"", $headers)) . "\n";
        $csv .= implode(',', array_map(fn ($v) => "\"{$v}\"", $example)) . "\n";

        return response($csv, 200, [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="template-importacao-produtos.csv"',
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'csv_file'    => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'update_mode' => ['required', 'in:create_only,update_existing,create_and_update'],
        ]);

        $file = $request->file('csv_file');
        $mode = $request->string('update_mode')->value();

        $logId = DB::table('sync_logs')->insertGetId([
            'source'     => 'csv_import',
            'started_at' => now(),
            'status'     => 'running',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $results = ['total' => 0, 'created' => 0, 'updated' => 0, 'errors' => 0, 'error_list' => []];

        try {
            $handle = fopen($file->getRealPath(), 'r');
            if ($handle === false) {
                throw new \RuntimeException('Não foi possível abrir o arquivo CSV.');
            }

            // Cabeçalho
            $header = fgetcsv($handle);
            if (! $header) {
                throw new \RuntimeException('Arquivo CSV vazio ou inválido.');
            }

            $header = array_map('strtolower', array_map('trim', $header));
            $header = array_map(fn ($h) => str_replace([' ', '-'], '_', $h), $header);

            while (($row = fgetcsv($handle)) !== false) {
                $results['total']++;
                try {
                    $data = array_combine($header, $row);
                    $this->processRow($data, $mode, $results);
                } catch (\Throwable $e) {
                    $results['errors']++;
                    $results['error_list'][] = [
                        'row'   => $results['total'],
                        'error' => $e->getMessage(),
                    ];
                }
            }

            fclose($handle);

            DB::table('sync_logs')->where('id', $logId)->update([
                'status'        => $results['errors'] > 0 ? 'partial' : 'success',
                'finished_at'   => now(),
                'total_items'   => $results['total'],
                'created_items' => $results['created'],
                'updated_items' => $results['updated'],
                'error_items'   => $results['errors'],
                'errors'        => $results['errors'] > 0 ? json_encode($results['error_list']) : null,
                'updated_at'    => now(),
            ]);
        } catch (\Throwable $e) {
            DB::table('sync_logs')->where('id', $logId)->update([
                'status'      => 'failed',
                'finished_at' => now(),
                'errors'      => json_encode(['fatal' => $e->getMessage()]),
                'updated_at'  => now(),
            ]);

            return back()->with('error', 'Erro ao processar o CSV: ' . $e->getMessage());
        }

        $msg = "Importação concluída: {$results['total']} linhas — "
             . "{$results['created']} criados, {$results['updated']} atualizados, {$results['errors']} erros.";

        return back()->with('success', $msg);
    }

    /** @param array<string, string> $data */
    private function processRow(array $data, string $mode, array &$results): void
    {
        $sku  = trim($data['sku'] ?? '');
        $name = trim($data['nome'] ?? $data['name'] ?? '');

        if ($sku === '' || $name === '') {
            throw new \InvalidArgumentException('SKU e Nome são obrigatórios.');
        }

        $priceCents = (int) round((float) str_replace(',', '.', $data['preco_venda_reais'] ?? '0') * 100);
        $compareCents = isset($data['preco_de_reais']) && $data['preco_de_reais'] !== ''
            ? (int) round((float) str_replace(',', '.', $data['preco_de_reais']) * 100)
            : null;
        $costCents = isset($data['custo_reais']) && $data['custo_reais'] !== ''
            ? (int) round((float) str_replace(',', '.', $data['custo_reais']) * 100)
            : null;

        $statusRaw = trim($data['status'] ?? 'draft');
        $status    = match ($statusRaw) {
            'published', 'publicado', '1' => ProductStatus::Published,
            'archived', 'arquivado'       => ProductStatus::Archived,
            default                        => ProductStatus::Draft,
        };

        // Resolver marca
        $brandId = null;
        $brandName = trim($data['marca'] ?? $data['brand'] ?? '');
        if ($brandName !== '') {
            $brand   = Brand::firstOrCreate(['slug' => Str::slug($brandName)], ['name' => $brandName, 'is_active' => true]);
            $brandId = $brand->id;
        }

        // Resolver categoria
        $categoryId = null;
        $catSlug    = trim($data['categoria_slug'] ?? $data['category_slug'] ?? '');
        if ($catSlug !== '') {
            $category   = Category::where('slug', $catSlug)->first();
            $categoryId = $category?->id;
        }

        $attrs = [
            'name'                   => $name,
            'slug'                   => Str::slug($name),
            'short_description'      => trim($data['descricao_curta'] ?? ''),
            'description'            => trim($data['descricao_completa'] ?? ''),
            'price_cents'            => $priceCents,
            'compare_at_price_cents' => $compareCents,
            'cost_cents'             => $costCents,
            'status'                 => $status,
            'brand_id'               => $brandId,
            'weight_grams'           => isset($data['peso_gramas']) && $data['peso_gramas'] !== '' ? (int) $data['peso_gramas'] : null,
            'featured'               => in_array($data['destaque'] ?? '0', ['1', 'true', 'sim'], true),
            'meta_title'             => trim($data['meta_titulo'] ?? ''),
            'meta_description'       => trim($data['meta_descricao'] ?? ''),
            'published_at'           => $status === ProductStatus::Published ? now() : null,
        ];

        $existing = Product::where('sku', $sku)->first();

        if ($existing) {
            if ($mode === 'create_only') {
                throw new \RuntimeException("SKU {$sku} já existe (modo criar apenas).");
            }
            $existing->update($attrs);
            if ($categoryId) {
                $existing->categories()->syncWithoutDetaching([$categoryId => ['is_primary' => true]]);
            }
            $results['updated']++;
        } else {
            if ($mode === 'update_existing') {
                throw new \RuntimeException("SKU {$sku} não encontrado (modo atualizar apenas).");
            }
            $product = Product::create(array_merge($attrs, ['sku' => $sku]));
            if ($categoryId) {
                $product->categories()->attach($categoryId, ['is_primary' => true]);
            }

            // Estoque inicial
            $stock = (int) ($data['estoque'] ?? $data['stock'] ?? 0);
            if ($stock > 0) {
                $warehouseId = DB::table('warehouses')->value('id') ?? 1;
                DB::table('stocks')->insertOrIgnore([
                    'product_id'         => $product->id,
                    'variant_id'         => null,
                    'warehouse_id'       => $warehouseId,
                    'quantity_available' => $stock,
                    'quantity_reserved'  => 0,
                    'created_at'         => now(),
                    'updated_at'         => now(),
                ]);
            }

            $results['created']++;
        }
    }
}
