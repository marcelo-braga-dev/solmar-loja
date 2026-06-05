<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Feature set:
 *  3. Tabelas de Preço — price_lists + product_prices
 *  2. Painel do Consultor — consultant_profiles + proposals + proposal_items + services
 * 11. Portal B2B — companies + company_users
 *     ALTER users: price_list_id, company_id
 */
return new class () extends Migration
{
    public function up(): void
    {
        // ══════════════════════════════════════════════════════════
        // #3 — TABELAS DE PREÇO
        // ══════════════════════════════════════════════════════════

        Schema::create('price_lists', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code', 20)->unique();       // PUBLICO, CONSULTOR, INTEGRADOR, DISTRIB
            $table->text('description')->nullable();
            $table->string('type', 20)->default('retail'); // retail|consultant|wholesale|special
            $table->unsignedSmallInteger('discount_percent')->default(0); // % base sobre preço público
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->boolean('is_public')->default(true);  // exibida no storefront?
            $table->date('valid_from')->nullable();
            $table->date('valid_until')->nullable();
            $table->timestamps();
        });

        Schema::create('product_prices', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('price_list_id')->constrained()->cascadeOnDelete();
            $table->unsignedBigInteger('price_cents');
            $table->unsignedBigInteger('compare_at_cents')->nullable();
            $table->timestamp('effective_from')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'price_list_id']);
            $table->index(['price_list_id', 'price_cents']);
        });

        // ══════════════════════════════════════════════════════════
        // #2 — CONSULTORES
        // ══════════════════════════════════════════════════════════

        Schema::create('consultant_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('phone', 20)->nullable();
            $table->string('region')->nullable();          // estado/região de atuação
            $table->decimal('commission_pct', 5, 2)->default(5.00); // % de comissão padrão
            $table->foreignId('price_list_id')->nullable()->constrained()->nullOnDelete(); // tabela de preço padrão
            // Metas mensais
            $table->unsignedBigInteger('monthly_goal_cents')->default(0);
            $table->unsignedSmallInteger('proposal_goal')->default(0); // meta de propostas/mês
            // Totais acumulados (atualizados por job)
            $table->unsignedBigInteger('total_revenue_cents')->default(0);
            $table->unsignedInteger('total_proposals')->default(0);
            $table->unsignedInteger('accepted_proposals')->default(0);
            $table->text('bio')->nullable();
            $table->timestamps();
        });

        Schema::create('services', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('unit', 10)->default('un');
            $table->unsignedBigInteger('default_price_cents')->default(0);
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        Schema::create('proposals', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();     // consultor
            $table->foreignId('customer_id')->nullable()->constrained()->nullOnDelete(); // cliente cadastrado
            $table->foreignId('company_id')->nullable(); // empresa B2B (FK adicionada depois)

            // Dados do prospect
            $table->string('customer_name');
            $table->string('customer_email')->nullable();
            $table->string('customer_phone', 20)->nullable();
            $table->string('customer_cpf_cnpj', 18)->nullable();
            $table->string('customer_city')->nullable();
            $table->string('customer_state', 2)->nullable();

            $table->string('title');
            $table->string('reference')->nullable();
            $table->string('status', 20)->default('draft')->index();
            // draft|sent|viewed|accepted|rejected|expired|converted

            $table->date('valid_until')->nullable();
            $table->unsignedBigInteger('subtotal_cents')->default(0);
            $table->unsignedBigInteger('discount_cents')->default(0);
            $table->unsignedBigInteger('tax_cents')->default(0);
            $table->unsignedBigInteger('total_cents')->default(0);

            $table->text('notes')->nullable();
            $table->text('internal_notes')->nullable();
            $table->json('simulator_data')->nullable();

            $table->string('pdf_path')->nullable();
            $table->timestamp('pdf_generated_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->timestamp('viewed_at')->nullable();
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('user_id');
        });

        Schema::create('proposal_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('proposal_id')->constrained()->cascadeOnDelete();
            $table->string('item_type', 20)->default('product'); // product|service|custom
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('service_id')->nullable()->constrained('services')->nullOnDelete();
            $table->string('description');
            $table->string('unit', 10)->default('un');
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_price_cents');
            $table->unsignedSmallInteger('discount_percent')->default(0);
            $table->unsignedBigInteger('total_cents');
            $table->text('notes')->nullable();
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->index(['proposal_id', 'position']);
        });

        // ══════════════════════════════════════════════════════════
        // #11 — PORTAL B2B (EMPRESAS / INTEGRADORES)
        // ══════════════════════════════════════════════════════════

        Schema::create('companies', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();

            // Identificação
            $table->string('razao_social');
            $table->string('nome_fantasia')->nullable();
            $table->string('cnpj', 18)->unique();          // com máscara: 00.000.000/0001-00
            $table->string('inscricao_estadual', 30)->nullable();
            $table->string('inscricao_municipal', 30)->nullable();
            $table->string('website')->nullable();
            $table->string('logo_url')->nullable();

            // Tipo de empresa
            $table->string('type', 20)->default('integrador'); // integrador|distribuidor|engenharia|revendedor|other
            $table->string('segment')->nullable();            // ex.: residencial, industrial, agro

            // Contato principal
            $table->string('contact_name');
            $table->string('contact_email');
            $table->string('contact_phone', 20)->nullable();
            $table->string('contact_whatsapp', 20)->nullable();

            // Endereço
            $table->string('cep', 9)->nullable();
            $table->string('street')->nullable();
            $table->string('number', 10)->nullable();
            $table->string('complement')->nullable();
            $table->string('district')->nullable();
            $table->string('city')->nullable();
            $table->string('state', 2)->nullable();

            // Configurações comerciais
            $table->foreignId('price_list_id')->nullable()->constrained()->nullOnDelete();
            $table->unsignedBigInteger('credit_limit_cents')->default(0);  // limite de crédito
            $table->unsignedSmallInteger('payment_term_days')->default(0); // prazo (0=à vista)
            $table->unsignedSmallInteger('extra_discount_pct')->default(0); // desconto adicional

            // Status
            $table->string('status', 20)->default('pending'); // pending|active|suspended|rejected
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();

            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
            $table->index('cnpj');
        });

        Schema::create('company_users', function (Blueprint $table): void {
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('role', 20)->default('member');  // owner|admin|member
            $table->boolean('is_primary_contact')->default(false);
            $table->timestamp('joined_at')->useCurrent();
            $table->timestamps();

            $table->primary(['company_id', 'user_id']);
            $table->index('user_id');
        });

        // Projetos/Obras vinculados a empresas
        Schema::create('company_projects', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('company_id')->constrained()->cascadeOnDelete();
            $table->string('name');                          // nome da obra/projeto
            $table->string('client_name')->nullable();       // nome do cliente final
            $table->string('city')->nullable();
            $table->string('state', 2)->nullable();
            $table->string('type', 30)->nullable();          // residencial|comercial|industrial|rural
            $table->decimal('system_kwp', 10, 2)->nullable(); // potência do sistema
            $table->string('status', 20)->default('prospect'); // prospect|approved|in_progress|completed|cancelled
            $table->date('started_at')->nullable();
            $table->date('completed_at')->nullable();
            $table->unsignedBigInteger('contract_value_cents')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['company_id', 'status']);
        });

        // ALTER users — adicionar price_list_id e company_id
        Schema::table('users', function (Blueprint $table): void {
            $table->foreignId('price_list_id')->nullable()->after('auth_provider')
                  ->constrained()->nullOnDelete();
            $table->foreignId('company_id')->nullable()->after('price_list_id')
                  ->constrained()->nullOnDelete();
        });

        // Adicionar company_id à proposals (FK agora que companies existe)
        Schema::table('proposals', function (Blueprint $table): void {
            $table->foreign('company_id')->references('id')->on('companies')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('proposals', fn ($t) => $t->dropForeign(['company_id']));
        Schema::table('users', fn ($t) => $t->dropColumn(['price_list_id', 'company_id']));

        Schema::dropIfExists('company_projects');
        Schema::dropIfExists('company_users');
        Schema::dropIfExists('companies');
        Schema::dropIfExists('proposal_items');
        Schema::dropIfExists('proposals');
        Schema::dropIfExists('services');
        Schema::dropIfExists('consultant_profiles');
        Schema::dropIfExists('product_prices');
        Schema::dropIfExists('price_lists');
    }
};
