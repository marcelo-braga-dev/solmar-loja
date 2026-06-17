<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // #12 — Wishlist sharing: token público por cliente
        Schema::table('customers', function (Blueprint $table): void {
            $table->uuid('wishlist_token')->nullable()->unique()->after('meta');
            $table->boolean('wishlist_public')->default(false)->after('wishlist_token');
        });

        // #18 — Comparison sync: comparações persistidas por usuário
        Schema::create('product_comparisons', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamps();

            $table->unique(['user_id', 'product_id']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->dropColumn(['wishlist_token', 'wishlist_public']);
        });

        Schema::dropIfExists('product_comparisons');
    }
};
