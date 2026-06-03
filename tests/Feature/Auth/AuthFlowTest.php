<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows login page', function (): void {
    $this->get('/login')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('Auth/Login'));
});

it('shows register page', function (): void {
    $this->get('/register')
        ->assertStatus(200)
        ->assertInertia(fn ($page) => $page->component('Auth/Register'));
});

it('redirects authenticated users away from guest routes', function (): void {
    $user = User::factory()->create();
    $this->actingAs($user)->get('/login')->assertRedirect();
});

it('requires auth for account area', function (): void {
    $this->get('/conta')->assertRedirect('/login');
});

it('requires admin for admin area', function (): void {
    $user = User::factory()->create();
    $this->actingAs($user)->get('/admin')->assertRedirect('/login');
});
