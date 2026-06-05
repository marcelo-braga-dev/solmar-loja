<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration
{
    public function up(): void
    {
        Schema::create('flash_sales', function (Blueprint $table): void {
            $table->id();
            $table->string('title');                                           // Ex.: "Promoção Relâmpago"
            $table->foreignId('product_id')->nullable()->constrained()->cascadeOnDelete(); // null = aplicar a todos com on_sale
            $table->unsignedSmallInteger('discount_percent');                 // % adicional de desconto
            $table->unsignedInteger('max_quantity')->nullable();              // limite de unidades
            $table->unsignedInteger('sold_count')->default(0);               // vendidos durante a flash
            $table->timestamp('starts_at');
            $table->timestamp('ends_at');
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['starts_at', 'ends_at', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('flash_sales');
    }
};
