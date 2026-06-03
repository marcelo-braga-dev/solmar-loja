<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_item_id')->nullable()->constrained('order_items')->nullOnDelete();
            $table->unsignedTinyInteger('rating'); // 1-5
            $table->string('title')->nullable();
            $table->text('comment');
            $table->string('status')->default('pending')->index(); // pending|approved|rejected
            $table->boolean('verified_purchase')->default(false);
            $table->string('reviewer_name')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'status']);
        });

        Schema::create('questions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('question');
            $table->string('status')->default('pending')->index(); // pending|answered|hidden
            $table->string('asker_name')->nullable();
            $table->timestamps();

            $table->index(['product_id', 'status']);
        });

        Schema::create('answers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('question_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->text('answer');
            $table->boolean('is_official')->default(false); // resposta da loja
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('answers');
        Schema::dropIfExists('questions');
        Schema::dropIfExists('reviews');
    }
};
