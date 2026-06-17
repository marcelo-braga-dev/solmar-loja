<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_images', function (Blueprint $table): void {
            // Identifica imagens geradas por sincronização automática (ex.: 'inverter', 'panel'),
            // permitindo localizar/atualizar a imagem certa em vez de duplicar a cada sync.
            $table->string('tag')->nullable()->after('is_cover');
            $table->index(['product_id', 'tag']);
        });
    }

    public function down(): void
    {
        Schema::table('product_images', function (Blueprint $table): void {
            $table->dropIndex(['product_id', 'tag']);
            $table->dropColumn('tag');
        });
    }
};
