<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Inventory\Contracts\ErpClientInterface;
use App\Domains\Inventory\Services\InventorySyncService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class IntegrationController extends Controller
{
    public function __construct(
        private readonly InventorySyncService $syncService,
        private readonly ErpClientInterface $erpClient,
    ) {}

    public function index(): Response
    {
        $config = [
            'base_url'         => config('services.erp.base_url', ''),
            'api_key_set'      => ! empty(config('services.erp.api_key', '')),
            'timeout'          => (int) config('services.erp.timeout', 30),
            'sync_enabled'     => (bool) config('services.erp.enabled', false),
            'gateway'          => config('services.payment.gateway', env('PAYMENT_GATEWAY', 'mock')),
        ];

        $syncLogs = DB::table('sync_logs')
            ->orderByDesc('started_at')
            ->limit(15)
            ->get()
            ->map(fn ($log) => [
                'id'            => $log->id,
                'source'        => $log->source,
                'status'        => $log->status,
                'status_label'  => match ($log->status) {
                    'success' => 'Sucesso',
                    'partial' => 'Parcial',
                    'failed'  => 'Falhou',
                    'running' => 'Executando...',
                    default   => $log->status,
                },
                'total_items'   => $log->total_items,
                'created_items' => $log->created_items,
                'updated_items' => $log->updated_items,
                'error_items'   => $log->error_items,
                'errors'        => $log->errors ? json_decode($log->errors, true) : null,
                'started_at'    => $log->started_at
                    ? \Carbon\Carbon::parse($log->started_at)->format('d/m/Y H:i:s')
                    : null,
                'finished_at'   => $log->finished_at
                    ? \Carbon\Carbon::parse($log->finished_at)->format('d/m/Y H:i:s')
                    : null,
                'duration_s'    => ($log->started_at && $log->finished_at)
                    ? \Carbon\Carbon::parse($log->finished_at)->diffInSeconds(\Carbon\Carbon::parse($log->started_at))
                    : null,
            ]);

        $lastSync = $syncLogs->first();

        $stats = [
            'total_syncs'    => DB::table('sync_logs')->count(),
            'success_rate'   => DB::table('sync_logs')->count() > 0
                ? round(DB::table('sync_logs')->where('status', 'success')->count() / DB::table('sync_logs')->count() * 100)
                : 0,
            'last_sync_at'   => $lastSync['started_at'] ?? null,
            'last_status'    => $lastSync['status'] ?? null,
            'products_synced' => DB::table('products')->whereNotNull('external_id')->count(),
        ];

        return Inertia::render('Admin/Integration/Index', [
            'config'   => $config,
            'syncLogs' => $syncLogs,
            'stats'    => $stats,
            'schema'   => $this->getApiSchema(),
            'envConfig' => [
                'payment_gateways' => [
                    ['value' => 'mock',  'label' => 'Mock (Simulação)'],
                    ['value' => 'asaas', 'label' => 'Asaas'],
                ],
            ],
        ]);
    }

    public function testConnection(): JsonResponse
    {
        if (empty(config('services.erp.base_url'))) {
            return response()->json([
                'success' => false,
                'message' => 'URL da API não configurada. Configure ERP_BASE_URL no .env',
            ]);
        }

        try {
            $available = $this->erpClient->isAvailable();

            return response()->json([
                'success' => $available,
                'message' => $available
                    ? 'Conexão estabelecida com sucesso!'
                    : 'Servidor respondeu, mas o endpoint /health retornou erro.',
                'url' => config('services.erp.base_url'),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Falha na conexão: ' . $e->getMessage(),
            ]);
        }
    }

    public function runSync(Request $request): JsonResponse
    {
        try {
            if (empty(config('services.erp.base_url')) || empty(config('services.erp.api_key'))) {
                return response()->json([
                    'success' => false,
                    'message' => 'Configure ERP_BASE_URL e ERP_API_KEY no arquivo .env antes de sincronizar.',
                ]);
            }

            $results = $this->syncService->sync();

            return response()->json([
                'success' => true,
                'message' => "Sincronização concluída: {$results['total']} produtos processados ({$results['created']} criados, {$results['updated']} atualizados, {$results['errors']} erros).",
                'results' => $results,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erro ao sincronizar: ' . $e->getMessage(),
            ]);
        }
    }

    public function clearLogs(): RedirectResponse
    {
        DB::table('sync_logs')
            ->where('status', '!=', 'running')
            ->where('created_at', '<', now()->subDays(30))
            ->delete();

        return back()->with('success', 'Logs antigos removidos.');
    }

    public function downloadSchema(): \Symfony\Component\HttpFoundation\Response
    {
        $schema = $this->getApiSchema();

        return response()->json($schema, 200, [
            'Content-Type'        => 'application/json',
            'Content-Disposition' => 'attachment; filename="solarhub-api-schema.json"',
        ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    }

    /** @return array<string, mixed> */
    private function getApiSchema(): array
    {
        return [
            '$schema'     => 'https://json-schema.org/draft/2020-12/schema',
            'title'       => 'SolarHub Commerce — API de Integração de Produtos',
            'version'     => '1.0.0',
            'description' => 'Schema JSON esperado pela plataforma SolarHub para importação de produtos via API REST. Endpoint configurado em ERP_BASE_URL.',
            'base_url'    => config('services.erp.base_url', 'https://api.seu-distribuidor.com.br'),
            'auth'        => [
                'type'   => 'Bearer Token',
                'header' => 'Authorization: Bearer {ERP_API_KEY}',
            ],
            'endpoints' => [
                [
                    'method'      => 'GET',
                    'path'        => '/health',
                    'description' => 'Verifica disponibilidade da API. Deve retornar HTTP 200.',
                    'response'    => ['status' => 'ok'],
                ],
                [
                    'method'      => 'GET',
                    'path'        => '/products',
                    'description' => 'Lista produtos com paginação.',
                    'query_params' => [
                        'page'     => 'Número da página (default: 1)',
                        'per_page' => 'Itens por página (default: 100, max: 500)',
                        'active'   => 'Filtrar apenas ativos: true|false',
                        'updated_since' => 'Filtrar por data (ISO 8601): 2025-01-01T00:00:00Z',
                    ],
                    'response_schema' => [
                        'meta' => [
                            'total'        => 'integer — total de produtos',
                            'per_page'     => 'integer — itens por página',
                            'current_page' => 'integer — página atual',
                            'last_page'    => 'integer — última página',
                        ],
                        'data' => [
                            '_type'  => 'array',
                            '_items' => [
                                'id'           => 'string|integer — ID único no sistema externo [OBRIGATÓRIO]',
                                'sku'          => 'string — código do produto (SKU/Part Number) [OBRIGATÓRIO]',
                                'name'         => 'string — nome completo do produto [OBRIGATÓRIO]',
                                'description'  => 'string — descrição longa em HTML ou texto',
                                'price'        => 'number — preço de venda em Reais (ex: 199.90) ou centavos (ex: 19990)',
                                'compare_price' => 'number|null — preço "De" para exibir desconto',
                                'cost'         => 'number|null — custo do produto (uso interno)',
                                'stock'        => 'integer — quantidade disponível em estoque',
                                'weight'       => 'number|null — peso em kg (ex: 1.5 = 1500g)',
                                'active'       => 'boolean — produto ativo para venda',
                                'brand'        => 'string|null — nome da marca/fabricante',
                                'category'     => 'string|null — categoria principal',
                                'image_url'    => 'string|null — URL da imagem principal',
                                'images'       => 'array|null — lista de URLs de imagens adicionais',
                                'specifications' => [
                                    '_type'        => 'object',
                                    '_description' => 'Especificações técnicas como chave-valor',
                                    '_example'     => [
                                        'Potência' => '550Wp',
                                        'Eficiência' => '21.4%',
                                        'Dimensões' => '2384x1303x35mm',
                                        'Peso' => '32.5kg',
                                        'Garantia' => '25 anos',
                                    ],
                                ],
                                'external_updated_at' => 'string|null — data da última atualização (ISO 8601)',
                            ],
                        ],
                    ],
                ],
            ],
            'field_mapping' => [
                '_description' => 'Mapeamento entre campos da API externa e campos da plataforma SolarHub',
                'campos' => [
                    ['external' => 'id / codigo / sku',          'internal' => 'external_id', 'required' => true,  'type' => 'string'],
                    ['external' => 'sku / codigo / part_number',  'internal' => 'sku',         'required' => true,  'type' => 'string'],
                    ['external' => 'name / nome / descricao',     'internal' => 'name',        'required' => true,  'type' => 'string'],
                    ['external' => 'price / preco / valor',       'internal' => 'price_cents', 'required' => true,  'type' => 'integer (centavos)'],
                    ['external' => 'compare_price / preco_de',   'internal' => 'compare_at_price_cents', 'required' => false, 'type' => 'integer (centavos)'],
                    ['external' => 'cost / custo',                'internal' => 'cost_cents',  'required' => false, 'type' => 'integer (centavos)'],
                    ['external' => 'stock / estoque / quantidade','internal' => 'quantity_available', 'required' => true, 'type' => 'integer'],
                    ['external' => 'weight / peso',               'internal' => 'weight_grams','required' => false, 'type' => 'integer (gramas)'],
                    ['external' => 'description / descricao_completa', 'internal' => 'description', 'required' => false, 'type' => 'string'],
                    ['external' => 'image_url / imagem',          'internal' => 'cover_image', 'required' => false, 'type' => 'string (URL)'],
                    ['external' => 'specifications / specs',      'internal' => 'specifications', 'required' => false, 'type' => 'object'],
                ],
            ],
            'example_response' => [
                'meta' => ['total' => 250, 'per_page' => 100, 'current_page' => 1, 'last_page' => 3],
                'data' => [
                    [
                        'id'          => 'CS7N-665MS',
                        'sku'         => 'CS7N-665MS',
                        'name'        => 'Módulo Solar Canadian Solar 665W Monocristalino',
                        'description' => 'Módulo solar monocristalino de alta eficiência...',
                        'price'       => 1159.00,
                        'compare_price' => 1399.00,
                        'cost'        => 754.00,
                        'stock'       => 48,
                        'weight'      => 32.5,
                        'active'      => true,
                        'brand'       => 'Canadian Solar',
                        'category'    => 'Painéis Solares',
                        'image_url'   => 'https://cdn.distribuidor.com.br/produtos/cs7n-665ms.jpg',
                        'specifications' => [
                            'Potência' => '665Wp',
                            'Eficiência' => '21.4%',
                            'Células' => '182mm Mono PERC',
                            'Dimensões' => '2384x1303x35mm',
                            'Peso' => '32.5kg',
                            'Garantia Produto' => '25 anos',
                            'Garantia Performance' => '30 anos',
                        ],
                        'external_updated_at' => '2025-06-01T14:30:00Z',
                    ],
                ],
            ],
            'webhook_optional' => [
                '_description' => 'O distribuidor pode opcionalmente notificar via webhook quando houver atualizações de estoque ou preço',
                'endpoint'     => 'POST /webhooks/erp',
                'headers'      => ['X-Webhook-Secret' => '{ERP_WEBHOOK_SECRET}'],
                'payload'      => [
                    'event'   => 'product.stock_updated | product.price_updated | product.created',
                    'product' => ['id' => 'string', 'sku' => 'string', 'stock' => 0, 'price' => 0.0],
                ],
            ],
        ];
    }
}
