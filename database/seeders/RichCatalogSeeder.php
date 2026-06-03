<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Catalog\Enums\ProductStatus;
use App\Domains\Catalog\Models\Brand;
use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use App\Domains\Catalog\Models\ProductImage;
use App\Domains\Support\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

final class RichCatalogSeeder extends Seeder
{
    // Picsum IDs que têm visual de tecnologia/industrial/outdoor
    private array $picsumIds = [
        1036, 1048, 1060, 1061, 1070, 1071, 1074, 1080,
        180,  181,  182,  237,  238,  239,  240,  244,
        250,  326,  327,  328,  329,  330,  366,  369,
        400,  401,  402,  403,  404,  405,  430,  431,
        450,  452,  453,  454,  455,  456,  470,  471,
        500,  501,  502,  503,  504,  505,  506,  507,
        550,  551,  552,  553,  554,  555,  556,  557,
        600,  601,  602,  603,  604,  605,  606,  607,
        630,  631,  633,  634,  635,  636,  637,  638,
        700,  701,  702,  703,  704,  705,  706,  707,
    ];

    private int $picsumIndex = 0;

    public function run(): void
    {
        $this->seedExtraCustomers();
        $this->seedProducts();
        $this->seedReviews();
    }

    // ─── Clientes ─────────────────────────────────────────────────────────────

    private function seedExtraCustomers(): void
    {
        $customers = [
            ['name' => 'Ana Paula Mendes', 'email' => 'ana.mendes@email.com.br'],
            ['name' => 'Carlos Eduardo Souza', 'email' => 'carlos.souza@gmail.com'],
            ['name' => 'Fernanda Lima', 'email' => 'fernanda.lima@hotmail.com'],
            ['name' => 'Roberto Alves', 'email' => 'roberto.alves@empresa.com.br'],
            ['name' => 'Mariana Costa', 'email' => 'mariana.costa@yahoo.com.br'],
            ['name' => 'João Pedro Santos', 'email' => 'joao.santos@outlook.com'],
            ['name' => 'Luciana Ferreira', 'email' => 'lu.ferreira@gmail.com'],
            ['name' => 'Thiago Rodrigues', 'email' => 'thiago.rodrigues@email.com'],
        ];

        foreach ($customers as $c) {
            if (User::where('email', $c['email'])->exists()) {
                continue;
            }
            $user = User::create([
                'name'              => $c['name'],
                'email'             => $c['email'],
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
            ]);
            $user->assignRole('customer');
            $user->customer()->create([
                'type'  => 'individual',
                'phone' => '(' . rand(11, 99) . ') 9' . rand(1000, 9999) . '-' . rand(1000, 9999),
            ]);
        }
    }

    // ─── Produtos ─────────────────────────────────────────────────────────────

    private function seedProducts(): void
    {
        $cats   = Category::all()->keyBy('slug');
        $brands = Brand::all();

        $brandMap = $brands->keyBy('slug');

        $canadian  = $brandMap['canadian-solar']  ?? $brands->first();
        $jinko     = $brandMap['jinko-solar']      ?? $brands->first();
        $longi     = $brandMap['longi-solar']      ?? $brands->first();
        $byd       = $brandMap['byd']              ?? $brands->first();
        $growatt   = $brandMap['growatt']          ?? $brands->first();
        $fronius   = $brandMap['fronius']          ?? $brands->first();
        $sma       = $brandMap['sma']              ?? $brands->first();
        $deye      = $brandMap['deye']             ?? $brands->first();
        $weg       = $brandMap['weg']              ?? $brands->first();
        $intelbras = $brandMap['intelbras']        ?? $brands->first();
        $huawei    = $brandMap['huawei']           ?? $brands->first();
        $abb       = $brandMap['abb']              ?? $brands->first();

        // ── Painéis Solares ──────────────────────────────────────────────────
        $panelCat = $cats['paineis-modulos-solares'] ?? null;
        $panels   = [
            [
                'name'  => 'Módulo Solar Canadian Solar CS7N-665MS 665W Monocristalino',
                'sku'   => 'CS7N-665MS',
                'price' => 115900, 'compare' => 139900,
                'brand' => $canadian,
                'specs' => ['Potência' => '665Wp', 'Eficiência' => '21,4%', 'Células' => '182mm Mono PERC', 'Dimensões' => '2384×1303×35mm', 'Peso' => '32,5kg', 'Garantia' => '25 anos produto / 30 anos performance'],
                'desc'  => 'Módulo solar monocristalino de alta eficiência da linha HiKu7, ideal para projetos de grande escala com excelente desempenho em baixa irradiância.',
                'featured' => true,
            ],
            [
                'name'  => 'Painel Solar Jinko Tiger Neo 580W Bifacial N-Type',
                'sku'   => 'JKM580N-72HL4-BDV',
                'price' => 105900, 'compare' => 125000,
                'brand' => $jinko,
                'specs' => ['Potência' => '580Wp', 'Eficiência' => '22,3%', 'Tipo' => 'N-Type Bifacial', 'Dimensões' => '2278×1134×30mm', 'Peso' => '28,8kg', 'Garantia' => '30 anos'],
                'desc'  => 'Tecnologia N-Type de última geração com dupla face para máxima captação de energia. Excelente para telhados claros e sistemas em solo.',
                'featured' => true,
            ],
            [
                'name'  => 'Módulo Solar LONGi Hi-MO 6 570W Monocristalino',
                'sku'   => 'LR5-72HTH-570M',
                'price' => 98900, 'compare' => 119900,
                'brand' => $longi,
                'specs' => ['Potência' => '570Wp', 'Eficiência' => '22,1%', 'Células' => 'HPBC Monocristalino', 'Dimensões' => '2256×1133×30mm', 'Peso' => '27,5kg'],
                'desc'  => 'A linha Hi-MO 6 da LONGi usa tecnologia HPBC exclusiva que combina as vantagens dos módulos PERC e HIT para máxima eficiência.',
                'featured' => false,
            ],
            [
                'name'  => 'Módulo Solar 550W Monocristalino Full Black',
                'sku'   => 'FB-550M-HV',
                'price' => 92900, 'compare' => 109900,
                'brand' => $canadian,
                'specs' => ['Potência' => '550Wp', 'Eficiência' => '21,1%', 'Tipo' => 'Monocristalino Full Black', 'Dimensões' => '2279×1134×35mm', 'Peso' => '27,8kg'],
                'desc'  => 'Módulo Full Black com visual sofisticado para projetos residenciais onde a estética é prioridade. Alta eficiência e acabamento escuro completo.',
                'featured' => true,
            ],
            [
                'name'  => 'Painel Solar BYD 430W Policristalino BYD430P6K-36',
                'sku'   => 'BYD430P6K-36',
                'price' => 69900, 'compare' => null,
                'brand' => $byd,
                'specs' => ['Potência' => '430Wp', 'Eficiência' => '17,6%', 'Tipo' => 'Policristalino', 'Dimensões' => '2094×1038×35mm', 'Peso' => '24,5kg'],
                'desc'  => 'Módulo solar policristalino com excelente custo-benefício para sistemas residenciais e pequenos comerciais.',
                'featured' => false,
            ],
            [
                'name'  => 'Módulo Solar 600W Bifacial Monocristalino HV Series',
                'sku'   => 'BIF-600M-HV',
                'price' => 112900, 'compare' => 135000,
                'brand' => $jinko,
                'specs' => ['Potência' => '600Wp', 'Eficiência' => '21,8%', 'Tipo' => 'Bifacial Monocristalino', 'Tensão Voc' => '49,8V', 'Corrente Isc' => '15,2A'],
                'desc'  => 'Módulo bifacial com alto ganho de geração pelo verso. Ideal para instalações em solo com superfícies claras e reflexivas.',
                'featured' => false,
            ],
            [
                'name'  => 'Painel Solar Canadian Solar 400W HiKu CS3W-400',
                'sku'   => 'CS3W-400P',
                'price' => 72900, 'compare' => 87900,
                'brand' => $canadian,
                'specs' => ['Potência' => '400Wp', 'Eficiência' => '19,6%', 'Dimensões' => '2008×1002×40mm', 'Peso' => '22kg', 'Garantia' => '25 anos'],
                'desc'  => 'Módulo solar da família HiKu, um dos mais vendidos do mercado brasileiro com ótimo custo-benefício e alta confiabilidade.',
                'featured' => false,
            ],
            [
                'name'  => 'Módulo Solar LONGi 455W Hi-MO4 PERC Mono',
                'sku'   => 'LR4-72HPH-455M',
                'price' => 77900, 'compare' => 92000,
                'brand' => $longi,
                'specs' => ['Potência' => '455Wp', 'Eficiência' => '20,6%', 'Células' => 'PERC 166mm', 'Peso' => '24,9kg'],
                'desc'  => 'Painel PERC monocristalino altamente eficiente com excelente relação preço/watt. Um dos mais usados em instalações residenciais no Brasil.',
                'featured' => false,
            ],
        ];

        foreach ($panels as $p) {
            $this->createProduct($p, $panelCat, $brands);
        }

        // ── Inversores String ────────────────────────────────────────────────
        $inverterCat    = $cats['inversores']         ?? null;
        $inverterStrCat = $cats['inversores-string']  ?? $inverterCat;
        $inverterHybCat = $cats['inversores-hibridos'] ?? $inverterCat;
        $inverterMicroCat = $cats['inversores-micro'] ?? $inverterCat;

        $inverters = [
            [
                'name'  => 'Inversor Solar Growatt MIN 3000TL-X 3kW On-Grid',
                'sku'   => 'GRW-MIN3KTL-X',
                'price' => 189900, 'compare' => 229900,
                'brand' => $growatt,
                'specs' => ['Potência' => '3kW', 'Tipo' => 'String On-Grid', 'Fases' => 'Monofásico', 'MPPT' => '2 entradas', 'Eficiência' => '98,4%', 'Garantia' => '10 anos'],
                'desc'  => 'Inversor string compacto e silencioso ideal para sistemas residenciais. Alta eficiência e monitoramento via app Shine.',
                'featured' => true,
            ],
            [
                'name'  => 'Inversor Fronius Symo 10.0-3-M 10kW Trifásico',
                'sku'   => 'FRN-SYMO10',
                'price' => 759900, 'compare' => 899900,
                'brand' => $fronius,
                'specs' => ['Potência' => '10kW', 'Tipo' => 'String On-Grid', 'Fases' => 'Trifásico', 'MPPT' => '2 entradas', 'Eficiência' => '98,0%', 'Display' => 'LCD'],
                'desc'  => 'Inversor premium austríaco para instalações comerciais e industriais. Reconhecido mundialmente pela confiabilidade e suporte técnico.',
                'featured' => true,
            ],
            [
                'name'  => 'Inversor SMA Sunny Boy 6.0 6kW Monofásico',
                'sku'   => 'SMA-SB6-1AV-41',
                'price' => 489900, 'compare' => 579000,
                'brand' => $sma,
                'specs' => ['Potência' => '6kW', 'Tipo' => 'String On-Grid', 'Fases' => 'Monofásico', 'MPPT' => '2 entradas', 'Eficiência' => '97,8%'],
                'desc'  => 'Inversor SMA com tecnologia alemã de ponta. OptiTracks para seguimento de ponto de máxima potência. Garantia estendida disponível.',
                'featured' => false,
            ],
            [
                'name'  => 'Inversor Growatt SPH 5000TL3 BH-UP 5kW Híbrido',
                'sku'   => 'GRW-SPH5KH',
                'price' => 549900, 'compare' => 649000,
                'brand' => $growatt,
                'specs' => ['Potência' => '5kW', 'Tipo' => 'Híbrido', 'Fases' => 'Trifásico', 'Bateria' => '48V LFP/Li-Ion', 'MPPT' => '2 entradas'],
                'desc'  => 'Inversor híbrido perfeito para quem quer independência energética. Suporta baterias de lítio e permite operação em modo off-grid.',
                'featured' => true,
            ],
            [
                'name'  => 'Inversor Deye SUN-12K-SG04LP3 12kW Trifásico Híbrido',
                'sku'   => 'DEY-12KH-3F',
                'price' => 889900, 'compare' => 1050000,
                'brand' => $deye,
                'specs' => ['Potência' => '12kW', 'Tipo' => 'Híbrido Trifásico', 'MPPT' => '4 entradas', 'Eficiência' => '97,8%', 'Display' => 'Touchscreen'],
                'desc'  => 'Inversor híbrido trifásico para projetos comerciais de médio porte. Alta potência com múltiplos MPPTs para máxima flexibilidade de projeto.',
                'featured' => false,
            ],
            [
                'name'  => 'Micro Inversor Hoymiles HM-1500 1500W',
                'sku'   => 'HOY-HM1500-4T',
                'price' => 149900, 'compare' => 179900,
                'brand' => $brands->random(),
                'specs' => ['Potência' => '1500W', 'Tipo' => 'Micro Inversor', 'Módulos' => '4 entradas', 'Monitoramento' => 'WiFi incluído', 'Garantia' => '12 anos'],
                'desc'  => 'Micro inversor de alta performance para instalações com sombreamento parcial. Cada módulo opera independentemente para máxima geração.',
                'featured' => false,
            ],
            [
                'name'  => 'Inversor Huawei SUN2000-10KTL-M1 10kW Trifásico',
                'sku'   => 'HWE-SUN2000-10K',
                'price' => 629900, 'compare' => 749000,
                'brand' => $huawei,
                'specs' => ['Potência' => '10kW', 'Tipo' => 'String On-Grid', 'Fases' => 'Trifásico', 'MPPT' => '4 entradas', 'Eficiência' => '98,6%'],
                'desc'  => 'Inversor Huawei com IA integrada para otimização automática de performance. Smart String Detection e inspeção de IV online.',
                'featured' => true,
            ],
            [
                'name'  => 'Inversor WEG SIW300H M020 20kW Trifásico',
                'sku'   => 'WEG-SIW300H-M020',
                'price' => 1290000, 'compare' => null,
                'brand' => $weg,
                'specs' => ['Potência' => '20kW', 'Tipo' => 'String On-Grid', 'Fases' => 'Trifásico', 'MPPT' => '6 entradas', 'Certificação' => 'INMETRO'],
                'desc'  => 'Inversor nacional WEG para projetos comerciais e industriais. Fabricado no Brasil com suporte técnico local e peças disponíveis no país.',
                'featured' => false,
            ],
        ];

        foreach ($inverters as $p) {
            $this->createProduct($p, $inverterStrCat, $brands);
        }

        // ── Baterias ─────────────────────────────────────────────────────────
        $batteryCat  = $cats['baterias-e-armazenamento'] ?? null;
        $battLithCat = $cats['baterias-de-litio']         ?? $batteryCat;
        $battStatCat = $cats['baterias-estacionarias']    ?? $batteryCat;

        $batteries = [
            [
                'name'  => 'Bateria de Lítio BYD Battery-Box Premium HVS 10.2kWh',
                'sku'   => 'BYD-BBOX-HVS102',
                'price' => 1890000, 'compare' => 2290000,
                'brand' => $byd,
                'specs' => ['Capacidade' => '10,2kWh', 'Tipo' => 'LFP (Lítio Ferro Fosfato)', 'Tensão' => 'Alta Tensão 200-800V', 'Ciclos' => '10.000 ciclos', 'Garantia' => '10 anos', 'IP' => 'IP55'],
                'desc'  => 'Sistema de armazenamento premium da BYD com química LFP (fosfato de ferro lítio), a mais segura e durável do mercado. Escalável até 66kWh.',
                'featured' => true,
            ],
            [
                'name'  => 'Bateria de Lítio Growatt ARK 10H-A1 9,6kWh',
                'sku'   => 'GRW-ARK10H-A1',
                'price' => 1590000, 'compare' => 1890000,
                'brand' => $growatt,
                'specs' => ['Capacidade' => '9,6kWh', 'Tipo' => 'LFP', 'Tensão' => '48V', 'Profundidade de Descarga' => '95%', 'Ciclos' => '6.000'],
                'desc'  => 'Bateria de lítio de baixa tensão compatível com inversores Growatt híbridos. Fácil instalação em paralelo para ampliar capacidade.',
                'featured' => true,
            ],
            [
                'name'  => 'Bateria Estacionária Moura Clean 220Ah 12V',
                'sku'   => 'MRA-MC220-12',
                'price' => 189900, 'compare' => 229000,
                'brand' => $brands->random(),
                'specs' => ['Capacidade' => '220Ah', 'Tensão' => '12V', 'Tipo' => 'VRLA AGM', 'Ciclos' => '1.200', 'Peso' => '65kg'],
                'desc'  => 'Bateria estacionária selada AGM de longa duração para sistemas off-grid e no-break. Não requer manutenção e não emite gases.',
                'featured' => false,
            ],
            [
                'name'  => 'Banco de Baterias 48V 200Ah LiFePO4 9,6kWh',
                'sku'   => 'LFP-48V-200AH',
                'price' => 899900, 'compare' => 1099000,
                'brand' => $brands->random(),
                'specs' => ['Capacidade' => '200Ah / 9,6kWh', 'Tensão' => '48V', 'Tipo' => 'LiFePO4', 'BMS' => 'Incluído', 'Ciclos' => '4.000+'],
                'desc'  => 'Banco de baterias de lítio pronto para uso com BMS integrado. Compatível com qualquer inversor híbrido 48V do mercado.',
                'featured' => false,
            ],
            [
                'name'  => 'Bateria Solar Estacionária Moura 150Ah 12V CS',
                'sku'   => 'MRA-CS150-12',
                'price' => 129900, 'compare' => null,
                'brand' => $brands->random(),
                'specs' => ['Capacidade' => '150Ah', 'Tensão' => '12V', 'Tipo' => 'Chumbo-Ácido Selado', 'Ciclos' => '500', 'Peso' => '43kg'],
                'desc'  => 'Bateria estacionária de entrada para sistemas off-grid de pequeno porte. Ótimo custo-benefício para cabanas, fazendas e chalés.',
                'featured' => false,
            ],
        ];

        foreach ($batteries as $p) {
            $this->createProduct($p, $battLithCat, $brands);
        }

        // ── Kits Fotovoltaicos ───────────────────────────────────────────────
        $kitsCat   = $cats['kits-fotovoltaicos']  ?? null;
        $kitsOnGrid  = $cats['kits-on-grid']    ?? $kitsCat;
        $kitsOffGrid = $cats['kits-off-grid']   ?? $kitsCat;

        $kits = [
            [
                'name'  => 'Kit Solar 5kWp On-Grid para Conta de R$300 — 10 Painéis 550W',
                'sku'   => 'KIT-5KWP-OG-10P',
                'price' => 1290000, 'compare' => 1590000,
                'brand' => $canadian,
                'specs' => ['Potência Total' => '5kWp', 'Painéis' => '10x 550W', 'Inversor' => '5kW String', 'Geração' => '≈550 kWh/mês (RJ)', 'Economia' => '≈R$220/mês'],
                'desc'  => 'Kit completo para residências com conta de luz entre R$250-R$400. Inclui 10 módulos 550W, inversor 5kW, string box CA/CC e documentação técnica para conexão à rede.',
                'featured' => true,
            ],
            [
                'name'  => 'Kit Solar 10kWp On-Grid Trifásico — 18 Painéis 600W',
                'sku'   => 'KIT-10KWP-OG-3F',
                'price' => 2490000, 'compare' => 2990000,
                'brand' => $growatt,
                'specs' => ['Potência Total' => '10kWp', 'Painéis' => '18x 600W', 'Inversor' => '10kW Trifásico', 'Geração' => '≈1100 kWh/mês (SP)', 'Payback' => '≈4,5 anos'],
                'desc'  => 'Kit solar para comércios e residências com consumo de R$600-R$900/mês. Sistema trifásico com monitoramento online incluído.',
                'featured' => true,
            ],
            [
                'name'  => 'Kit Solar 3kWp Off-Grid com Bateria — Casa de Campo',
                'sku'   => 'KIT-3KWP-OFF-BAT',
                'price' => 1890000, 'compare' => 2290000,
                'brand' => $deye,
                'specs' => ['Potência Total' => '3kWp', 'Painéis' => '6x 550W', 'Inversor' => '3kW Híbrido', 'Bateria' => '9,6kWh LFP', 'Autonomia' => '≈24h para consumo básico'],
                'desc'  => 'Kit completo para locais sem acesso à rede elétrica: sítios, chácaras, barcos e cabanas. Inclui inversor híbrido, baterias de lítio e suporte.',
                'featured' => true,
            ],
            [
                'name'  => 'Kit Solar 7kWp On-Grid — Residência Grande',
                'sku'   => 'KIT-7KWP-OG-RES',
                'price' => 1790000, 'compare' => 2150000,
                'brand' => $fronius,
                'specs' => ['Potência Total' => '7kWp', 'Painéis' => '13x 560W', 'Inversor' => '6kW Monofásico', 'Geração' => '≈770 kWh/mês', 'Economia' => '≈R$350/mês'],
                'desc'  => 'Kit ideal para casas grandes com ar-condicionado, piscina e alto consumo. Inclui monitoramento em tempo real e garantias de 10-25 anos.',
                'featured' => false,
            ],
        ];

        foreach ($kits as $p) {
            $this->createProduct($p, $kitsOnGrid, $brands);
        }

        // ── Estruturas de Fixação ────────────────────────────────────────────
        $estruturaCat = $cats['estruturas-de-fixacao'] ?? null;

        $estruturas = [
            [
                'name'  => 'Estrutura de Fixação para Telhado Cerâmico — Kit 10 Módulos',
                'sku'   => 'EST-CER-KIT10',
                'price' => 89900, 'compare' => 109900,
                'brand' => $brands->random(),
                'specs' => ['Material' => 'Alumínio 6005-T5', 'Compatível com' => 'Telhado Cerâmico / Francês', 'Capacidade' => '10 módulos', 'Inclinação' => '15-35°', 'Vento' => 'Até 160km/h'],
                'desc'  => 'Kit de estrutura em alumínio anodizado de alta resistência para telhado cerâmico. Instala sem furar a telha com gancho especial. Inclui parafusos em aço inox.',
                'featured' => false,
            ],
            [
                'name'  => 'Estrutura para Telhado Metálico Trapezoidal — Kit 10 Módulos',
                'sku'   => 'EST-MET-KIT10',
                'price' => 79900, 'compare' => 95000,
                'brand' => $brands->random(),
                'specs' => ['Material' => 'Alumínio + Aço Galvanizado', 'Compatível com' => 'Telha Trapezoidal Metálica', 'Capacidade' => '10 módulos', 'Fixação' => 'Clamp universal'],
                'desc'  => 'Estrutura leve e resistente para telhados industriais metálicos. Instalação rápida com clamps universais sem necessidade de furar a telha.',
                'featured' => false,
            ],
            [
                'name'  => 'Estrutura Solo / Chão para 20 Módulos — Ajustável 10-40°',
                'sku'   => 'EST-SOLO-20M',
                'price' => 245900, 'compare' => null,
                'brand' => $brands->random(),
                'specs' => ['Material' => 'Aço Galvanizado + Alumínio', 'Capacidade' => '20 módulos', 'Inclinação' => '10° a 40° ajustável', 'Fixação' => 'Parafusos no solo'],
                'desc'  => 'Estrutura em aço galvanizado para instalação de painéis solares diretamente no solo. Inclinação ajustável para maximizar geração conforme latitude.',
                'featured' => false,
            ],
        ];

        foreach ($estruturas as $p) {
            $this->createProduct($p, $estruturaCat, $brands);
        }

        // ── Cabos e Conectores ───────────────────────────────────────────────
        $caboCat = $cats['cabos-e-conectores'] ?? null;

        $cabos = [
            [
                'name'  => 'Cabo Solar 6mm² Preto — Rolo 100m XLPE/PV1-F',
                'sku'   => 'CAB-6MM-PTO-100M',
                'price' => 18900, 'compare' => 23900,
                'brand' => $brands->random(),
                'specs' => ['Seção' => '6mm²', 'Cor' => 'Preto', 'Norma' => 'PV1-F / EN 50618', 'Temperatura' => '-40°C a +90°C', 'Comprimento' => '100 metros', 'Tensão' => '1.500V DC'],
                'desc'  => 'Cabo solar flexível de alta qualidade resistente a UV e intempéries. Indicado para conexão entre módulos fotovoltaicos e inversores.',
                'featured' => false,
            ],
            [
                'name'  => 'Cabo Solar 6mm² Vermelho — Rolo 100m XLPE/PV1-F',
                'sku'   => 'CAB-6MM-VRM-100M',
                'price' => 18900, 'compare' => 23900,
                'brand' => $brands->random(),
                'specs' => ['Seção' => '6mm²', 'Cor' => 'Vermelho', 'Norma' => 'PV1-F', 'Comprimento' => '100 metros', 'Tensão' => '1.500V DC'],
                'desc'  => 'Cabo solar vermelho (polo positivo) resistente a intempéries e raios UV. Par ideal com o cabo preto para instalações profissionais.',
                'featured' => false,
            ],
            [
                'name'  => 'Kit 20 Pares de Conectores MC4 Multimarca',
                'sku'   => 'CON-MC4-KIT20P',
                'price' => 8900, 'compare' => 12900,
                'brand' => $brands->random(),
                'specs' => ['Quantidade' => '20 pares (40 unidades)', 'Padrão' => 'MC4 compatível', 'Corrente' => 'Até 30A', 'Tensão' => 'Até 1.500V', 'IP' => 'IP67'],
                'desc'  => 'Kit de conectores MC4 de alta qualidade para conexão dos módulos solares. Compatível com painéis de todos os fabricantes do mercado.',
                'featured' => false,
            ],
            [
                'name'  => 'String Box CC 2E/2S com DPS e Disjuntor — 1000V',
                'sku'   => 'STR-CC-2E2S-1KV',
                'price' => 34900, 'compare' => 43900,
                'brand' => $intelbras,
                'specs' => ['Entradas' => '2 strings', 'Saídas' => '2', 'DPS' => 'Classe II 40kA', 'Tensão Máxima' => '1.000V DC', 'IP' => 'IP66', 'Material' => 'Poliéster'],
                'desc'  => 'String box para proteção do sistema fotovoltaico no lado CC. Inclui DPS, chave seccionadora e disjuntores para proteção completa.',
                'featured' => false,
            ],
        ];

        foreach ($cabos as $p) {
            $this->createProduct($p, $caboCat, $brands);
        }

        // ── Monitoramento ────────────────────────────────────────────────────
        $monitorCat = $cats['monitoramento'] ?? null;

        $monitores = [
            [
                'name'  => 'Datalogger WiFi para Inversores Growatt — ShineWiFi-X',
                'sku'   => 'GRW-SHINEWIFI-X',
                'price' => 24900, 'compare' => 32900,
                'brand' => $growatt,
                'specs' => ['Conexão' => 'WiFi 2.4GHz + Ethernet', 'Compatível com' => 'Inversores Growatt', 'App' => 'ShinePhone / ShineServer', 'Protocolos' => 'Modbus RS485'],
                'desc'  => 'Monitor WiFi para acompanhar a geração solar em tempo real pelo celular. Conecta ao inversor Growatt e envia dados para nuvem automaticamente.',
                'featured' => false,
            ],
            [
                'name'  => 'Medidor de Energia Bidirecional Intelbras EBS 1F 65A',
                'sku'   => 'ITB-EBS1F-65A',
                'price' => 19900, 'compare' => 24900,
                'brand' => $intelbras,
                'specs' => ['Corrente' => '65A', 'Fases' => 'Monofásico', 'Comunicação' => 'RS485 Modbus', 'Homologação' => 'INMETRO', 'Compatível' => 'Todos inversores'],
                'desc'  => 'Medidor bidirecional para monitoramento de geração e consumo. Obrigatório pela distribuidora para sistemas de energia solar conectados à rede.',
                'featured' => false,
            ],
            [
                'name'  => 'Monitor Solar Fronius Smart Meter TS 65A-3',
                'sku'   => 'FRN-SMARTMETER-65A',
                'price' => 89900, 'compare' => 109900,
                'brand' => $fronius,
                'specs' => ['Corrente' => '65A', 'Fases' => 'Trifásico', 'Interface' => 'Fronius Solar.web', 'Precisão' => 'Classe 0.5'],
                'desc'  => 'Medidor inteligente Fronius para monitoramento preciso de energia trifásica. Integração nativa com Fronius Solar.web para análise detalhada.',
                'featured' => false,
            ],
        ];

        foreach ($monitores as $p) {
            $this->createProduct($p, $monitorCat, $brands);
        }

        // ── Mobilidade Elétrica ──────────────────────────────────────────────
        $mobilCat    = $cats['mobilidade-eletrica']    ?? null;
        $bikeCat     = $cats['bicicletas-eletricas']   ?? $mobilCat;
        $patinCat    = $cats['patinetes-eletricos']    ?? $mobilCat;
        $carregCat   = $cats['carregadores-veiculares'] ?? $mobilCat;

        $mobilidade = [
            [
                'name'  => 'Bicicleta Elétrica 29" 750W Bateria 48V 13Ah — Trek eBike Pro',
                'sku'   => 'BIKE-29-750W-48V',
                'price' => 789900, 'compare' => 989900,
                'brand' => $brands->random(),
                'specs' => ['Motor' => '750W Hub Traseiro', 'Bateria' => '48V 13Ah LFP', 'Autonomia' => 'Até 80km', 'Velocidade máx.' => '45 km/h', 'Peso' => '26kg', 'Freios' => 'Hidráulico Shimano'],
                'desc'  => 'Bicicleta elétrica de alta performance com motor traseiro potente e bateria de longa duração. Perfeita para ciclismo urbano e trilhas leves.',
                'featured' => true,
            ],
            [
                'name'  => 'Patinete Elétrico 10" 500W Dobrável — Xiaomi Pro 3',
                'sku'   => 'PAT-10-500W-XM',
                'price' => 289900, 'compare' => 349900,
                'brand' => $brands->random(),
                'specs' => ['Motor' => '500W', 'Bateria' => '36V 12,8Ah', 'Autonomia' => 'Até 45km', 'Velocidade' => 'Até 30km/h', 'Peso' => '14,2kg', 'IP' => 'IPX4'],
                'desc'  => 'Patinete elétrico dobrável premium com app integrado, luz LED e freio regenerativo. Ideal para o último quilômetro em cidades.',
                'featured' => true,
            ],
            [
                'name'  => 'Estação de Carregamento Veicular 22kW Trifásico — WallBox Pulsar Plus',
                'sku'   => 'WBOX-PULSAR-22K',
                'price' => 549900, 'compare' => 679000,
                'brand' => $brands->random(),
                'specs' => ['Potência' => '22kW Trifásico', 'Tensão' => '380V / 3F', 'Corrente' => 'Até 32A', 'Conector' => 'Tipo 2 (IEC 62196)', 'Wi-Fi' => 'Incluído', 'App' => 'myWallbox'],
                'desc'  => 'Carregador doméstico e comercial de alta potência para carros elétricos. Carrega um EV em 3-4 horas. Controle remoto pelo app.',
                'featured' => false,
            ],
            [
                'name'  => 'Carregador Veicular 7,4kW Monofásico — EVSE Residencial',
                'sku'   => 'EVSE-7K4-MONO',
                'price' => 189900, 'compare' => 239900,
                'brand' => $intelbras,
                'specs' => ['Potência' => '7,4kW', 'Tensão' => '220V Monofásico', 'Corrente' => '32A', 'Conector' => 'Tipo 2', 'IP' => 'IP54'],
                'desc'  => 'EVSE residencial para recarga noturna de veículos elétricos. Instalação simples em tomada 32A. Compatível com todos os EVs do mercado.',
                'featured' => false,
            ],
        ];

        foreach ($mobilidade as $p) {
            $this->createProduct($p, $bikeCat, $brands);
        }

        // ── Iluminação LED ───────────────────────────────────────────────────
        $ledCat = $cats['iluminacao-led'] ?? null;

        $leds = [
            [
                'name'  => 'Luminária LED de Rua 150W 22.500lm IP67 — Pública',
                'sku'   => 'LED-RUA-150W-IP67',
                'price' => 45900, 'compare' => 59900,
                'brand' => $brands->random(),
                'specs' => ['Potência' => '150W', 'Fluxo Luminoso' => '22.500lm', 'Eficiência' => '150lm/W', 'IP' => 'IP67', 'IK' => 'IK09', 'Vida útil' => '50.000h', 'CCT' => '5.000K'],
                'desc'  => 'Luminária de poste para vias públicas e estacionamentos. Alta eficiência energética com economia de 60% em relação a lâmpadas de sódio.',
                'featured' => false,
            ],
            [
                'name'  => 'Painel LED Embutido 48W Slim 60x60cm 6.000lm',
                'sku'   => 'LED-PAINEL-60-48W',
                'price' => 8900, 'compare' => 12900,
                'brand' => $brands->random(),
                'specs' => ['Potência' => '48W', 'Fluxo' => '6.000lm', 'Dimensões' => '595x595mm', 'Instalação' => 'Embutido forro/gesso', 'Driver' => 'Externo incluído', 'IP' => 'IP40'],
                'desc'  => 'Painel LED slim para forros de gesso e PVC. Substituição direta de luminárias fluorescentes 4x32W com economia de 65% de energia.',
                'featured' => false,
            ],
            [
                'name'  => 'Refletor LED Solar 200W com Sensor — Energia 100% Solar',
                'sku'   => 'REF-LED-SOL-200W',
                'price' => 34900, 'compare' => 44900,
                'brand' => $brands->random(),
                'specs' => ['Potência LED' => '200W equivalente', 'Painel Solar' => '30W integrado', 'Bateria' => '5Ah LFP', 'Sensor' => 'Presença + Crepuscular', 'IP' => 'IP66', 'Autonomia' => '12h'],
                'desc'  => 'Refletor completamente independente da rede elétrica. Perfeito para áreas externas, fazendas e locais sem energia. Liga automático ao anoitecer.',
                'featured' => false,
            ],
            [
                'name'  => 'Lâmpada LED Bulbo 15W E27 1350lm Bivolt',
                'sku'   => 'LED-BULB-E27-15W',
                'price' => 1490, 'compare' => 2290,
                'brand' => $intelbras,
                'specs' => ['Potência' => '15W', 'Equivalente' => '100W incandescente', 'Fluxo' => '1.350lm', 'Vida útil' => '25.000h', 'Bivolt' => '100-240V', 'Certificação' => 'INMETRO A'],
                'desc'  => 'Lâmpada LED de alta eficiência certificada pelo INMETRO classe A. Economia de 85% em relação à lâmpada incandescente equivalente.',
                'featured' => false,
            ],
        ];

        foreach ($leds as $p) {
            $this->createProduct($p, $ledCat, $brands);
        }

        // ── No-Breaks ────────────────────────────────────────────────────────
        $nobreakCat = $cats['no-breaks-ups'] ?? null;

        $nobreaks = [
            [
                'name'  => 'No-Break Senoidal Puro 1200VA / 720W — SMS Premium',
                'sku'   => 'NB-SENOIDAL-1200VA',
                'price' => 189900, 'compare' => 239900,
                'brand' => $brands->random(),
                'specs' => ['Potência' => '720W / 1200VA', 'Saída' => 'Senoidal Pura', 'Bateria' => '12V 9Ah (interna)', 'Autonomia' => '≈30min carga leve', 'Tomadas' => '6x NBR 14136', 'Display' => 'LCD'],
                'desc'  => 'No-break senoidal puro ideal para equipamentos sensíveis: servidores, equipamentos médicos e inversores solares. Proteção total contra surtos e variações.',
                'featured' => false,
            ],
            [
                'name'  => 'No-Break 3kVA Trifásico Senoidal — Data Center',
                'sku'   => 'NB-3KVA-3F-SEN',
                'price' => 890000, 'compare' => null,
                'brand' => $abb,
                'specs' => ['Potência' => '2.400W / 3000VA', 'Saída' => 'Senoidal Pura Trifásico', 'Comunicação' => 'SNMP + USB + RS232', 'Bypass' => 'Automático', 'Bateria' => 'Externa'],
                'desc'  => 'UPS online de dupla conversão para data centers e salas de servidores. Alta confiabilidade com bypass automático e monitoramento SNMP.',
                'featured' => false,
            ],
        ];

        foreach ($nobreaks as $p) {
            $this->createProduct($p, $nobreakCat, $brands);
        }

        // ── Protetores ───────────────────────────────────────────────────────
        $protCat = $cats['protetores-e-dispositivos'] ?? null;

        $protetores = [
            [
                'name'  => 'DPS DC 1000V 40kA — Protetor Surto Raio Solar CC',
                'sku'   => 'DPS-CC-1000V-40KA',
                'price' => 8900, 'compare' => 12900,
                'brand' => $intelbras,
                'specs' => ['Tensão Máx.' => '1.000V DC', 'Corrente' => '40kA (10/350μs)', 'Classe' => 'II', 'Conexão' => 'DIN Rail', 'Indicação' => 'LED de falha'],
                'desc'  => 'Dispositivo de proteção contra surto para o lado CC do sistema fotovoltaico. Protege inversores e módulos contra descargas atmosféricas.',
                'featured' => false,
            ],
            [
                'name'  => 'String Box Completa CA 3F — DPS + Disjuntor + Relé',
                'sku'   => 'STR-CA-3F-COMP',
                'price' => 59900, 'compare' => 74900,
                'brand' => $intelbras,
                'specs' => ['Fases' => 'Trifásico', 'DPS CA' => 'Classe II 40kA', 'Disjuntor' => '63A tripolar', 'IP' => 'IP65', 'Material' => 'ABS + Metalon'],
                'desc'  => 'String box para o lado CA com proteção completa: DPS, disjuntor geral e chave seccionadora. Obrigatória pela norma ABNT NBR 16690.',
                'featured' => false,
            ],
        ];

        foreach ($protetores as $p) {
            $this->createProduct($p, $protCat, $brands);
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** @param array<string, mixed> $data */
    private function createProduct(array $data, ?Category $category, \Illuminate\Database\Eloquent\Collection $brands): Product
    {
        $slug = Str::slug($data['name']);

        if (Product::where('slug', $slug)->exists()) {
            $slug = $slug . '-' . substr(md5($data['sku']), 0, 5);
        }

        $product = Product::create([
            'name'                   => $data['name'],
            'slug'                   => $slug,
            'sku'                    => $data['sku'],
            'price_cents'            => $data['price'],
            'compare_at_price_cents' => $data['compare'] ?? null,
            'cost_cents'             => (int) ($data['price'] * 0.65),
            'status'                 => ProductStatus::Published,
            'brand_id'               => ($data['brand'] ?? null)?->id ?? $brands->random()->id,
            'short_description'      => Str::limit($data['desc'], 160),
            'description'            => $data['desc'],
            'specifications'         => $data['specs'] ?? [],
            'weight_grams'           => (int) ($data['specs']['Peso'] ?? rand(500, 30000)),
            'featured'               => $data['featured'] ?? false,
            'published_at'           => now()->subDays(rand(0, 90)),
        ]);

        if ($category) {
            $product->categories()->attach($category->id, ['is_primary' => true]);
        }

        // Imagem principal via Picsum (seed determinístico pelo SKU)
        $picsumSeed = urlencode($data['sku']);
        ProductImage::create([
            'product_id' => $product->id,
            'path'       => "https://picsum.photos/seed/{$picsumSeed}/800/800",
            'alt'        => $data['name'],
            'position'   => 0,
            'is_cover'   => true,
        ]);

        // Segunda imagem (variação de seed)
        $picsumId = $this->picsumIds[$this->picsumIndex % count($this->picsumIds)];
        $this->picsumIndex++;
        ProductImage::create([
            'product_id' => $product->id,
            'path'       => "https://picsum.photos/id/{$picsumId}/800/800",
            'alt'        => $data['name'] . ' — detalhe',
            'position'   => 1,
            'is_cover'   => false,
        ]);

        // Stock
        $this->createStock($product);

        return $product;
    }

    private function createStock(Product $product): void
    {
        $warehouseId = \Illuminate\Support\Facades\DB::table('warehouses')->value('id');
        if (! $warehouseId) {
            return;
        }

        \Illuminate\Support\Facades\DB::table('stocks')->insertOrIgnore([
            'product_id'         => $product->id,
            'variant_id'         => null,
            'warehouse_id'       => $warehouseId,
            'quantity_available' => rand(5, 80),
            'quantity_reserved'  => 0,
            'created_at'         => now(),
            'updated_at'         => now(),
        ]);
    }

    // ─── Reviews ──────────────────────────────────────────────────────────────

    private function seedReviews(): void
    {
        $products = Product::published()->inRandomOrder()->limit(20)->get();
        $users    = User::whereHas('roles', fn ($q) => $q->where('name', 'customer'))->get();

        if ($users->isEmpty()) {
            return;
        }

        $comments = [
            'Produto excelente! Chegou bem embalado e dentro do prazo. Recomendo.',
            'Ótima qualidade, superou minhas expectativas. Instalação tranquila.',
            'Muito bom custo-benefício. Gerando bem acima do esperado pelo simulador.',
            'Produto de qualidade premium, exatamente como descrito. 5 estrelas!',
            'Boa compra. O suporte técnico da loja foi excelente para tirar dúvidas.',
            'Material de primeira, instalação simples. Sistema funcionando perfeitamente.',
            'Chegou antes do prazo e embalagem impecável. Produto conforme especificado.',
            'Produto bom porém a documentação técnica estava em inglês.',
            'Excelente produto! Já notei redução significativa na conta de luz.',
            'Qualidade muito boa. Só demorou um pouco mais que o previsto para entregar.',
        ];

        foreach ($products as $product) {
            $numReviews = rand(1, 4);
            for ($i = 0; $i < $numReviews; $i++) {
                $rating = rand(3, 5);
                Review::create([
                    'product_id'        => $product->id,
                    'user_id'           => $users->random()->id,
                    'rating'            => $rating,
                    'title'             => $rating >= 4 ? 'Produto recomendado!' : 'Bom produto',
                    'comment'           => $comments[array_rand($comments)],
                    'status'            => 'approved',
                    'verified_purchase' => (bool) rand(0, 1),
                    'created_at'        => now()->subDays(rand(1, 120)),
                    'updated_at'        => now()->subDays(rand(0, 30)),
                ]);
            }
        }
    }
}
