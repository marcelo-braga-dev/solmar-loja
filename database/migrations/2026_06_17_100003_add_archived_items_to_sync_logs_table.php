<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sync_logs', function (Blueprint $table): void {
            $table->unsignedInteger('archived_items')->default(0)->after('error_items');
        });
    }

    public function down(): void
    {
        Schema::table('sync_logs', function (Blueprint $table): void {
            $table->dropColumn('archived_items');
        });
    }
};
