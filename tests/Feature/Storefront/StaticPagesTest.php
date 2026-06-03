<?php

declare(strict_types=1);

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('shows about page', function (): void {
    $this->get('/sobre')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Storefront/Sobre'));
});

it('shows contact page', function (): void {
    $this->get('/contato')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Storefront/Contato'));
});

it('shows privacy page', function (): void {
    $this->get('/privacidade')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Storefront/Privacidade'));
});

it('shows blog index', function (): void {
    $this->get('/blog')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Storefront/Blog/Index'));
});

it('shows simulator page', function (): void {
    $this->get('/simulador')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Storefront/Simulator'));
});

it('shows home page', function (): void {
    $this->get('/')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Storefront/Home'));
});

it('shows error 404 for non-existent routes', function (): void {
    $this->get('/pagina-que-nao-existe')->assertStatus(404);
});

it('contact form validates required fields', function (): void {
    $this->post('/contato', [])->assertSessionHasErrors(['name', 'email', 'subject', 'message']);
});
