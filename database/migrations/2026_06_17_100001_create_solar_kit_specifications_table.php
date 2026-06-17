<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solar_kit_specifications', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->unique()->constrained()->cascadeOnDelete();

            // Identificação na origem (AppSolar / Edeltec)
            $table->string('supplier_sku')->index();
            $table->string('supplier_name');
            $table->boolean('supplier_available')->default(true);

            // Preços informados pelo fornecedor (espelho de price_cents/cost_cents do Product)
            $table->unsignedBigInteger('supplier_cost_price_cents');
            $table->unsignedBigInteger('supplier_sale_price_cents');

            // Especificações do kit
            $table->decimal('kit_power_kwp', 8, 2);
            $table->string('voltage')->nullable();
            $table->string('structure_type')->nullable();

            // Inversor
            $table->string('inverter_brand')->nullable();
            $table->string('inverter_brand_logo_url')->nullable();
            $table->string('inverter_image_url')->nullable();
            $table->decimal('inverter_power_kw', 8, 2)->nullable();

            // Painel
            $table->string('panel_brand')->nullable();
            $table->string('panel_brand_logo_url')->nullable();
            $table->string('panel_image_url')->nullable();
            $table->unsignedInteger('panel_power_w')->nullable();

            // Conteúdo livre
            $table->longText('components_html')->nullable();
            $table->text('supplier_notes')->nullable();

            // Controle de sincronização incremental (atualizado_em da origem)
            $table->timestamp('supplier_updated_at')->nullable()->index();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solar_kit_specifications');
    }
};
