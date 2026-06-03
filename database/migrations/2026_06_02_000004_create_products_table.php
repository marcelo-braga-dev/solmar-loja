<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->string('sku')->unique();
            $table->text('short_description')->nullable();
            $table->longText('description')->nullable();

            // Preços em centavos (nunca float)
            $table->unsignedBigInteger('price_cents');
            $table->unsignedBigInteger('compare_at_price_cents')->nullable();
            $table->unsignedBigInteger('cost_cents')->nullable();

            $table->string('status')->default('draft')->index();
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();

            // Dimensões para frete
            $table->unsignedInteger('weight_grams')->nullable();
            $table->unsignedInteger('length_mm')->nullable();
            $table->unsignedInteger('width_mm')->nullable();
            $table->unsignedInteger('height_mm')->nullable();

            // Ficha técnica livre
            $table->json('specifications')->nullable();

            $table->boolean('featured')->default(false)->index();

            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            // Integração com ERP/distribuidor
            $table->string('external_id')->nullable()->index();
            $table->timestamp('synced_at')->nullable();

            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['status', 'featured']);
            $table->index(['status', 'published_at']);
            $table->index('price_cents');
            $table->index('brand_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
