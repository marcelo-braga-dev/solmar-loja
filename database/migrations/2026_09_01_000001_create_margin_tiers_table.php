<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('margin_tiers', function (Blueprint $table): void {
            $table->id();
            $table->decimal('min_kwp', 8, 2);
            $table->decimal('max_kwp', 8, 2)->nullable(); // null = sem limite superior (faixa mais alta)
            $table->decimal('margin_percent', 6, 2); // ex.: 35.50 = 35,5% sobre o preço do fornecedor
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['is_active', 'min_kwp']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('margin_tiers');
    }
};
