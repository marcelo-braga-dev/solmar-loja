<?php

declare(strict_types=1);

use App\Domains\Orders\Models\Proposal;
use App\Domains\Orders\Services\ProposalService;
use App\Mail\ProposalSent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

function actingAsConsultant(): User
{
    Role::firstOrCreate(['name' => 'consultant', 'guard_name' => 'web']);

    $consultant = User::factory()->create();
    $consultant->assignRole('consultant');

    test()->actingAs($consultant);

    return $consultant;
}

function validProposalPayload(array $overrides = []): array
{
    return array_merge([
        'title'          => 'Kit Solar 5kWp Residencial',
        'customer_name'  => 'João da Silva',
        'customer_email' => 'joao@example.com',
        'items'          => [
            ['item_type' => 'custom', 'description' => 'Painel solar 550W', 'quantity' => 10, 'unit_price_cents' => 90000, 'discount_percent' => 0],
        ],
    ], $overrides);
}

it('blocks non-consultant users from the proposals area', function (): void {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->get('/consultor/propostas')->assertRedirect('/login');
});

it('lists only the authenticated consultant own proposals', function (): void {
    $consultant = actingAsConsultant();
    $other = User::factory()->create();

    Proposal::factory()->count(2)->create(['user_id' => $consultant->id]);
    Proposal::factory()->count(3)->create(['user_id' => $other->id]);

    $this->get('/consultor/propostas')
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Consultant/Proposals')
            ->has('proposals.data', 2));
});

it('shows the create proposal form', function (): void {
    actingAsConsultant();

    $this->get('/consultor/propostas/criar')->assertOk();
});

it('creates a proposal in draft status', function (): void {
    $consultant = actingAsConsultant();

    $response = $this->post('/consultor/propostas', validProposalPayload());

    $proposal = Proposal::where('user_id', $consultant->id)->first();
    expect($proposal)->not->toBeNull();
    expect($proposal->status)->toBe('draft');
    expect($proposal->total_cents)->toBe(900000);

    $response->assertRedirect("/consultor/propostas/{$proposal->uuid}");
});

it('validates required fields when creating a proposal', function (): void {
    actingAsConsultant();

    $this->post('/consultor/propostas', [])
        ->assertSessionHasErrors(['title', 'customer_name', 'items']);
});

it('shows a proposal owned by the consultant', function (): void {
    $consultant = actingAsConsultant();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id]);

    $this->get("/consultor/propostas/{$proposal->uuid}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Consultant/ShowProposal')
            ->where('proposal.uuid', $proposal->uuid)
            ->where('proposal.public_url', route('proposals.public.show', $proposal->uuid)));
});

it('returns 404 when trying to view another consultant proposal', function (): void {
    actingAsConsultant();
    $other = User::factory()->create();
    $proposal = Proposal::factory()->create(['user_id' => $other->id]);

    $this->get("/consultor/propostas/{$proposal->uuid}")->assertNotFound();
});

it('allows editing a draft proposal', function (): void {
    $consultant = actingAsConsultant();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id, 'status' => 'draft']);

    $this->get("/consultor/propostas/{$proposal->uuid}/editar")
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Consultant/CreateProposal'));
});

it('blocks editing a proposal that is no longer a draft', function (): void {
    $consultant = actingAsConsultant();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id, 'status' => 'sent']);

    $this->get("/consultor/propostas/{$proposal->uuid}/editar")->assertForbidden();
});

it('updates a draft proposal', function (): void {
    $consultant = actingAsConsultant();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id, 'status' => 'draft']);

    $this->put("/consultor/propostas/{$proposal->uuid}", validProposalPayload(['title' => 'Título Atualizado']))
        ->assertRedirect("/consultor/propostas/{$proposal->uuid}");

    expect($proposal->refresh()->title)->toBe('Título Atualizado');
});

it('sends a draft proposal by email', function (): void {
    Mail::fake();

    $consultant = actingAsConsultant();
    $proposal = Proposal::factory()->create([
        'user_id'        => $consultant->id,
        'status'         => 'draft',
        'customer_email' => 'cliente@example.com',
    ]);

    $this->post("/consultor/propostas/{$proposal->uuid}/enviar")->assertRedirect();

    expect($proposal->refresh()->status)->toBe('sent');
    Mail::assertQueued(ProposalSent::class);
});

it('refuses to send a proposal without customer email', function (): void {
    $consultant = actingAsConsultant();
    $proposal = Proposal::factory()->create([
        'user_id'        => $consultant->id,
        'status'         => 'draft',
        'customer_email' => null,
    ]);

    $this->post("/consultor/propostas/{$proposal->uuid}/enviar")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($proposal->refresh()->status)->toBe('draft');
});

it('deletes a draft proposal', function (): void {
    $consultant = actingAsConsultant();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id, 'status' => 'draft']);

    $this->delete("/consultor/propostas/{$proposal->uuid}")->assertRedirect('/consultor/propostas');

    expect(Proposal::find($proposal->id))->toBeNull();
});

it('refuses to delete a proposal that is no longer a draft', function (): void {
    $consultant = actingAsConsultant();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id, 'status' => 'sent']);

    $this->delete("/consultor/propostas/{$proposal->uuid}")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect(Proposal::find($proposal->id))->not->toBeNull();
});
