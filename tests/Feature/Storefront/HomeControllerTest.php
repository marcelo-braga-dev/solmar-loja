<?php

declare(strict_types=1);

use App\Domains\Catalog\Models\Category;
use App\Domains\Catalog\Models\Product;
use App\Domains\Marketing\Models\Post;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('renders the homepage with all expected shared and page props', function (): void {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Storefront/Home')
            ->has('featuredProducts')
            ->has('onSaleProducts')
            ->has('generatorProducts')
            ->has('brands')
            ->has('latestPosts'));
});

it('includes published products from the geradores-fotovoltaicos category as generatorProducts', function (): void {
    $category = Category::factory()->create(['slug' => 'geradores-fotovoltaicos']);
    $kit = Product::factory()->published()->create(['name' => 'Kit Solar 5kWp On-Grid']);
    $kit->categories()->attach($category->id);

    $unrelated = Product::factory()->published()->create(['name' => 'Painel Solar Avulso']);

    $this->get('/')
        ->assertInertia(fn ($page) => $page
            ->has('generatorProducts', 1)
            ->where('generatorProducts.0.name', 'Kit Solar 5kWp On-Grid'));
});

it('includes published products from child categories of geradores-fotovoltaicos', function (): void {
    $parent = Category::factory()->create(['slug' => 'geradores-fotovoltaicos']);
    $child = Category::factory()->create(['slug' => 'geradores-portateis', 'parent_id' => $parent->id]);
    $kit = Product::factory()->published()->create(['name' => 'Kit Solar 8kWp Trifásico']);
    $kit->categories()->attach($child->id);

    $this->get('/')
        ->assertInertia(fn ($page) => $page
            ->has('generatorProducts', 1)
            ->where('generatorProducts.0.name', 'Kit Solar 8kWp Trifásico'));
});

it('does not include draft products as generatorProducts', function (): void {
    $category = Category::factory()->create(['slug' => 'geradores-fotovoltaicos']);
    $draft = Product::factory()->draft()->create();
    $draft->categories()->attach($category->id);

    $this->get('/')
        ->assertInertia(fn ($page) => $page->has('generatorProducts', 0));
});

it('includes the most recent published posts as latestPosts', function (): void {
    $author = User::factory()->create();

    $published = Post::create([
        'author_id' => $author->id,
        'title' => 'Como escolher o kit solar ideal',
        'content' => str_repeat('energia solar ', 50),
        'excerpt' => 'Guia completo',
        'status' => 'published',
        'published_at' => now()->subDay(),
    ]);

    Post::create([
        'author_id' => $author->id,
        'title' => 'Rascunho ainda não publicado',
        'content' => 'conteúdo',
        'status' => 'draft',
        'published_at' => null,
    ]);

    $this->get('/')
        ->assertInertia(fn ($page) => $page
            ->has('latestPosts', 1)
            ->where('latestPosts.0.title', $published->title)
            ->where('latestPosts.0.reading_time', $published->readingTime()));
});

it('limits latestPosts to the 3 most recent published posts', function (): void {
    $author = User::factory()->create();

    for ($i = 0; $i < 5; $i++) {
        Post::create([
            'author_id' => $author->id,
            'title' => "Post {$i}",
            'content' => 'conteúdo de teste',
            'status' => 'published',
            'published_at' => now()->subDays($i),
        ]);
    }

    $this->get('/')
        ->assertInertia(fn ($page) => $page->has('latestPosts', 3));
});
