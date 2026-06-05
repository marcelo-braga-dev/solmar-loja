<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class () extends Migration
{
    public function up(): void
    {
        // Relações entre produtos (upsell, cross-sell, frequentemente juntos)
        Schema::create('product_relations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('related_product_id')->constrained('products')->cascadeOnDelete();
            $table->string('type')->default('cross_sell'); // cross_sell | upsell | frequently_bought
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();

            $table->unique(['product_id', 'related_product_id', 'type']);
            $table->index(['product_id', 'type']);
        });

        // Cotações / Orçamentos
        Schema::create('quotes', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('phone')->nullable();
            $table->string('company')->nullable();
            $table->string('cnpj', 18)->nullable();
            $table->json('items');              // [{product_id, name, qty, price_cents}]
            $table->text('message')->nullable();
            $table->string('status')->default('pending'); // pending|reviewing|sent|accepted|rejected
            $table->integer('quoted_total_cents')->nullable();
            $table->integer('discount_percent')->nullable();
            $table->text('admin_notes')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });

        // Devoluções / RMA
        Schema::create('returns', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('reason');           // defect|wrong_product|changed_mind|damaged|other
            $table->text('description');
            $table->json('items');              // [{order_item_id, qty, reason}]
            $table->json('images')->nullable(); // fotos do produto com defeito
            $table->string('status')->default('requested'); // requested|approved|rejected|received|refunded
            $table->integer('refund_amount_cents')->nullable();
            $table->string('refund_method')->nullable(); // original|credit|bank_transfer
            $table->text('admin_notes')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'status']);
            $table->index(['order_id']);
        });

        // Tickets de Suporte
        Schema::create('support_tickets', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name');
            $table->string('email');
            $table->string('subject');
            $table->string('category')->default('general'); // general|technical|order|payment|returns
            $table->string('priority')->default('normal');  // low|normal|high|urgent
            $table->string('status')->default('open');      // open|in_progress|waiting|resolved|closed
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->timestamps();

            $table->index(['status', 'priority', 'created_at']);
            $table->index('user_id');
        });

        Schema::create('support_replies', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('ticket_id')->constrained('support_tickets')->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('message');
            $table->boolean('is_staff')->default(false);
            $table->json('attachments')->nullable();
            $table->timestamps();

            $table->index(['ticket_id', 'created_at']);
        });

        // Campo para foto social login
        Schema::table('users', function (Blueprint $table): void {
            $table->string('google_id')->nullable()->unique()->after('email');
            $table->string('avatar_url')->nullable()->after('google_id');
            $table->string('auth_provider')->default('email')->after('avatar_url'); // email|google
        });

        // Campo images nas reviews
        Schema::table('reviews', function (Blueprint $table): void {
            $table->json('images')->nullable()->after('comment');
        });
    }

    public function down(): void
    {
        Schema::table('reviews', fn ($t) => $t->dropColumn('images'));
        Schema::table('users', fn ($t) => $t->dropColumn(['google_id', 'avatar_url', 'auth_provider']));
        Schema::dropIfExists('support_replies');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('returns');
        Schema::dropIfExists('quotes');
        Schema::dropIfExists('product_relations');
    }
};
