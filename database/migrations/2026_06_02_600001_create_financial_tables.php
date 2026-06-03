<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table): void {
            $table->id();
            $table->string('type')->index();      // revenue|expense
            $table->string('category')->index();  // ex.: product_sale, shipping_cost, refund
            $table->unsignedBigInteger('amount_cents');
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('description');
            $table->date('date')->index();
            $table->string('status')->default('confirmed'); // pending|confirmed|reconciled
            $table->string('reference')->nullable(); // ex.: payment_id, invoice_id
            $table->timestamps();

            $table->index(['type', 'date']);
            $table->index(['category', 'date']);
        });

        Schema::create('reconciliations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('payment_id')->constrained()->cascadeOnDelete();
            $table->foreignId('transaction_id')->nullable()->constrained()->nullOnDelete();
            $table->string('gateway_statement_id')->nullable();
            $table->unsignedBigInteger('amount_cents');
            $table->string('status')->default('pending'); // pending|matched|divergent
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('commissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('beneficiary_id')->constrained('users')->cascadeOnDelete();
            $table->unsignedBigInteger('amount_cents');
            $table->decimal('rate', 5, 2); // percentual
            $table->string('status')->default('pending'); // pending|paid|canceled
            $table->timestamp('paid_at')->nullable();
            $table->timestamps();

            $table->index(['beneficiary_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('commissions');
        Schema::dropIfExists('reconciliations');
        Schema::dropIfExists('transactions');
    }
};
