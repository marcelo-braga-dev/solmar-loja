<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(\Database\Seeders\RolesAndPermissionsSeeder::class);
});

it('blocks guests from admin', function (): void {
    $this->get('/admin')->assertRedirect('/login');
});

it('blocks non-admin from admin', function (): void {
    $user = User::factory()->create();
    $user->assignRole('customer');

    $this->actingAs($user)->get('/admin')->assertRedirect('/login');
});

it('allows admin to access dashboard', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Admin/Dashboard'));
});

it('admin can view orders list', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin/orders')->assertOk();
});

it('admin can view products list', function (): void {
    $admin = User::factory()->create();
    $admin->assignRole('admin');

    $this->actingAs($admin)->get('/admin/products')->assertOk();
});
