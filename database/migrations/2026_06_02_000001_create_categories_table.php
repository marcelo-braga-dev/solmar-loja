<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->foreignId('parent_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->text('description')->nullable();
            $table->string('image')->nullable();
            $table->string('icon')->nullable();
            $table->unsignedInteger('position')->default(0);
            $table->boolean('is_active')->default(true)->index();

            // SEO
            $table->string('meta_title')->nullable();
            $table->text('meta_description')->nullable();

            // Nested set helpers para árvore eficiente
            $table->unsignedInteger('_lft')->default(0)->index();
            $table->unsignedInteger('_rgt')->default(0)->index();
            $table->unsignedInteger('depth')->default(0);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['parent_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
