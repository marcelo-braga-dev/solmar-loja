<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Produto ↔ Categoria (N-N)
        Schema::create('category_product', function (Blueprint $table): void {
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->boolean('is_primary')->default(false);
            $table->timestamps();
            $table->primary(['category_id', 'product_id']);
        });

        // Produto ↔ Valores de Atributo (N-N)
        Schema::create('product_attribute_values', function (Blueprint $table): void {
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('attribute_value_id')->constrained('attribute_values')->cascadeOnDelete();
            $table->primary(['product_id', 'attribute_value_id']);
        });

        // Downloads de produto (datasheets, manuais)
        Schema::create('product_downloads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->string('path');
            $table->string('type')->nullable(); // datasheet, manual, warranty
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();

            $table->index(['product_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_downloads');
        Schema::dropIfExists('product_attribute_values');
        Schema::dropIfExists('category_product');
    }
};
