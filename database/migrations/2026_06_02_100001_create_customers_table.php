<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('phone', 20)->nullable();
            $table->string('cpf_cnpj', 18)->nullable()->index();
            $table->string('type', 10)->default('pf'); // pf | pj
            $table->date('birth_date')->nullable();
            $table->boolean('accepts_marketing')->default(false);
            $table->string('newsletter_token')->nullable(); // double opt-in
            $table->timestamp('newsletter_confirmed_at')->nullable();
            $table->json('meta')->nullable(); // dados extras livres
            $table->timestamps();
        });

        Schema::create('addresses', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->string('label')->nullable(); // Ex.: "Casa", "Trabalho"
            $table->string('recipient');
            $table->string('cep', 9);
            $table->string('street');
            $table->string('number', 20);
            $table->string('complement')->nullable();
            $table->string('district');
            $table->string('city');
            $table->string('state', 2);
            $table->string('country', 2)->default('BR');
            $table->boolean('is_default_shipping')->default(false)->index();
            $table->boolean('is_default_billing')->default(false)->index();
            $table->timestamps();

            $table->index('customer_id');
        });

        Schema::create('favorites', function (Blueprint $table): void {
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->primary(['customer_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('favorites');
        Schema::dropIfExists('addresses');
        Schema::dropIfExists('customers');
    }
};
