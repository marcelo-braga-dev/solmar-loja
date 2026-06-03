<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cupons (criado primeiro — carts e orders fazem FK para coupons)
        Schema::create('coupons', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->string('type')->default('percentage'); // percentage|fixed|free_shipping
            $table->unsignedInteger('value'); // porcentagem ou centavos
            $table->unsignedBigInteger('min_order_cents')->default(0);
            $table->unsignedInteger('max_uses')->nullable();
            $table->unsignedInteger('used_count')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamps();
        });

        // Carrinho (sessão ou persistido)
        Schema::create('carts', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('session_id')->nullable()->index();
            $table->foreignId('coupon_id')->nullable()->constrained('coupons')->nullOnDelete();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
        });

        Schema::create('cart_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('cart_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->unsignedBigInteger('unit_price_cents');
            $table->timestamps();

            $table->index(['cart_id', 'product_id']);
        });

        // Pedidos
        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('status')->default('pending')->index();
            $table->unsignedBigInteger('subtotal_cents');
            $table->unsignedBigInteger('discount_cents')->default(0);
            $table->unsignedBigInteger('shipping_cents')->default(0);
            $table->unsignedBigInteger('total_cents');
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();
            $table->json('shipping_address');
            $table->json('billing_address')->nullable();
            $table->string('shipping_method')->nullable();
            $table->text('notes')->nullable();
            $table->timestamp('placed_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['user_id', 'status']);
            $table->index('placed_at');
        });

        Schema::create('order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('variant_id')->nullable()->constrained('product_variants')->nullOnDelete();
            $table->string('name');
            $table->string('sku');
            $table->unsignedBigInteger('unit_price_cents');
            $table->unsignedSmallInteger('quantity');
            $table->unsignedBigInteger('total_cents');
            $table->timestamps();
        });

        Schema::create('shipments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('carrier')->nullable();
            $table->string('service')->nullable();
            $table->string('tracking_code')->nullable()->index();
            $table->string('label_url')->nullable();
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('cost_cents')->default(0);
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('cart_items');
        Schema::dropIfExists('carts');
        Schema::dropIfExists('coupons');
    }
};
