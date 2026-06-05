<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration
{
    public function up(): void
    {
        // Alertas de volta ao estoque
        Schema::create('stock_alerts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('email');
            $table->string('name')->nullable();
            $table->string('token', 64)->unique(); // para cancelar a inscrição
            $table->timestamp('notified_at')->nullable();
            $table->timestamps();

            $table->unique(['product_id', 'email']);
            $table->index('notified_at');
        });

        // Campo para rastrear carrinhos abandonados
        Schema::table('carts', function (Blueprint $table): void {
            $table->timestamp('abandoned_at')->nullable()->after('coupon_id');
            $table->timestamp('recovery_email_sent_at')->nullable()->after('abandoned_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_alerts');
        Schema::table('carts', function (Blueprint $table): void {
            $table->dropColumn(['abandoned_at', 'recovery_email_sent_at']);
        });
    }
};
