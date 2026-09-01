<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->decimal('kit_power_kwp', 8, 2)->nullable()->after('cost_cents');
            $table->index('kit_power_kwp');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropIndex(['kit_power_kwp']);
            $table->dropColumn('kit_power_kwp');
        });
    }
};
