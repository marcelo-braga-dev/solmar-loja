<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Saldo de pontos por cliente
        Schema::create('loyalty_balances', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->integer('points')->default(0); // 1 ponto = R$ 0,01 de crédito
            $table->integer('lifetime_points')->default(0); // total acumulado histórico
            $table->timestamps();
        });

        // Histórico de movimentos de pontos
        Schema::create('loyalty_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type', 20); // earn | redeem | expire | adjust
            $table->integer('points'); // positivo = ganho, negativo = resgate
            $table->integer('balance_after'); // saldo após a transação
            $table->string('description', 255);
            $table->nullableMorphs('source'); // ex: Order, Coupon
            $table->timestamp('expires_at')->nullable(); // pontos expiram em 1 ano
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loyalty_transactions');
        Schema::dropIfExists('loyalty_balances');
    }
};
