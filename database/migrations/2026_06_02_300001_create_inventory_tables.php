<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('warehouses', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('code')->unique();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('stocks', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('quantity_available')->default(0);
            $table->unsignedInteger('quantity_reserved')->default(0);
            $table->timestamps();

            $table->unique(['product_id', 'variant_id', 'warehouse_id']);
            $table->index('product_id');
        });

        Schema::create('stock_movements', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->foreignId('warehouse_id')->constrained()->cascadeOnDelete();
            $table->string('type')->index(); // in|out|reservation|release|sync|adjustment
            $table->integer('quantity'); // positivo = entrada, negativo = saída
            $table->string('reason')->nullable();
            $table->string('reference')->nullable(); // ex.: order_id, sync_id
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['product_id', 'type']);
            $table->index('created_at');
        });

        Schema::create('sync_logs', function (Blueprint $table): void {
            $table->id();
            $table->string('source'); // erp, distributor_name, etc.
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->string('status')->default('running'); // running|success|partial|failed
            $table->unsignedInteger('total_items')->default(0);
            $table->unsignedInteger('created_items')->default(0);
            $table->unsignedInteger('updated_items')->default(0);
            $table->unsignedInteger('error_items')->default(0);
            $table->json('errors')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Audit logs — rastreabilidade de todas as ações sensíveis
        Schema::create('audit_logs', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('action'); // ex.: product.updated, order.refunded
            $table->string('auditable_type');
            $table->unsignedBigInteger('auditable_id');
            $table->json('before')->nullable();
            $table->json('after')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['auditable_type', 'auditable_id']);
            $table->index('user_id');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('sync_logs');
        Schema::dropIfExists('stock_movements');
        Schema::dropIfExists('stocks');
        Schema::dropIfExists('warehouses');
    }
};
