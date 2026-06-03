<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('method')->index();          // pix|boleto|credit_card
            $table->string('gateway');                   // mercadopago|pagarme|asaas|mock
            $table->string('gateway_transaction_id')->nullable()->index();
            $table->string('status')->default('pending')->index(); // pending|processing|approved|failed|refunded|expired
            $table->unsignedBigInteger('amount_cents');
            $table->unsignedSmallInteger('installments')->default(1);

            // Dados específicos do método
            $table->string('pix_qr_code')->nullable();
            $table->text('pix_copy_paste')->nullable();
            $table->string('boleto_url')->nullable();
            $table->string('boleto_barcode')->nullable();
            $table->string('card_last4')->nullable();
            $table->string('card_brand')->nullable();

            $table->json('gateway_payload')->nullable(); // resposta raw do gateway
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['order_id', 'status']);
        });

        Schema::create('payment_webhooks', function (Blueprint $table): void {
            $table->id();
            $table->string('gateway')->index();
            $table->string('event_type');
            $table->string('gateway_event_id')->nullable()->index(); // idempotência
            $table->json('payload');
            $table->string('status')->default('received'); // received|processed|failed|ignored
            $table->text('error')->nullable();
            $table->timestamp('processed_at')->nullable();
            $table->timestamps();

            $table->unique(['gateway', 'gateway_event_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_webhooks');
        Schema::dropIfExists('payments');
    }
};
