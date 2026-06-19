<?php

declare(strict_types=1);

use App\Domains\Settings\Models\Setting;
use App\Domains\Settings\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('falls back to the app name when no store_name setting exists', function (): void {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('branding.store_name', config('app.name')));
});

it('reflects an admin-configured store name in the shared branding prop', function (): void {
    Setting::create([
        'group' => 'general',
        'key'   => 'store_name',
        'value' => 'Energia Verde Brasil',
        'type'  => 'string',
        'label' => 'Nome da loja',
    ]);
    app(SettingsService::class)->clearCache();

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('branding.store_name', 'Energia Verde Brasil'));
});

it('reflects an admin-configured logo url in the shared branding prop', function (): void {
    Setting::create([
        'group' => 'branding',
        'key'   => 'logo_url',
        'value' => '/storage/branding/logo.png',
        'type'  => 'string',
        'label' => 'Logo',
    ]);
    app(SettingsService::class)->clearCache();

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->where('branding.logo_url', '/storage/branding/logo.png'));
});

it('embeds the configured store name in the initial server-rendered title and meta tags', function (): void {
    Setting::create([
        'group' => 'general',
        'key'   => 'store_name',
        'value' => 'Energia Verde Brasil',
        'type'  => 'string',
        'label' => 'Nome da loja',
    ]);
    app(SettingsService::class)->clearCache();

    $this->get('/')
        ->assertOk()
        ->assertSee('<title inertia>Energia Verde Brasil</title>', false)
        ->assertSee('og:site_name" content="Energia Verde Brasil"', false);
});

it('updates the branding settings via the admin panel', function (): void {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);

    $admin = \App\Models\User::factory()->create();
    $admin->assignRole('admin');
    $this->actingAs($admin);

    $this->post('/admin/branding', [
        'store_name' => 'Nova Marca Solar',
    ])->assertRedirect();

    expect(app(SettingsService::class)->get('store_name'))->toBe('Nova Marca Solar');
});
