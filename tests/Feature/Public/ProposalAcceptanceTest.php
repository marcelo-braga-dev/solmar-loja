<?php

declare(strict_types=1);

use App\Domains\Orders\Models\Proposal;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;

uses(RefreshDatabase::class);

it('shows a public proposal and marks it as viewed on first access', function (): void {
    $proposal = Proposal::factory()->create(['user_id' => User::factory(), 'status' => 'sent']);

    $this->get("/proposta/{$proposal->uuid}")
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Public/ProposalView')
            ->where('proposal.uuid', $proposal->uuid)
            ->where('proposal.status', 'viewed'));

    expect($proposal->refresh()->status)->toBe('viewed');
    expect($proposal->viewed_at)->not->toBeNull();
});

it('returns 404 for an unknown proposal uuid', function (): void {
    $this->get('/proposta/00000000-0000-0000-0000-000000000000')->assertNotFound();
});

it('allows accepting a sent proposal and notifies the consultant', function (): void {
    Notification::fake();

    $consultant = User::factory()->create();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id, 'status' => 'sent']);

    $this->post("/proposta/{$proposal->uuid}/aceitar")
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($proposal->refresh()->status)->toBe('accepted');
    expect($proposal->accepted_at)->not->toBeNull();
    Notification::assertSentTo($consultant, \App\Notifications\ProposalRespondedNotification::class);
});

it('allows rejecting a viewed proposal with a reason', function (): void {
    Notification::fake();

    $consultant = User::factory()->create();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id, 'status' => 'viewed']);

    $this->post("/proposta/{$proposal->uuid}/recusar", ['reason' => 'Fora do orçamento'])
        ->assertRedirect()
        ->assertSessionHas('success');

    expect($proposal->refresh()->status)->toBe('rejected');
    expect($proposal->internal_notes)->toContain('Fora do orçamento');
});

it('blocks accepting a proposal that is still a draft', function (): void {
    $consultant = User::factory()->create();
    $proposal = Proposal::factory()->create(['user_id' => $consultant->id, 'status' => 'draft']);

    $this->post("/proposta/{$proposal->uuid}/aceitar")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($proposal->refresh()->status)->toBe('draft');
});

it('blocks accepting a proposal that was already accepted', function (): void {
    $consultant = User::factory()->create();
    $proposal = Proposal::factory()->create([
        'user_id'     => $consultant->id,
        'status'      => 'accepted',
        'accepted_at' => now(),
    ]);

    $this->post("/proposta/{$proposal->uuid}/aceitar")
        ->assertRedirect()
        ->assertSessionHas('error');
});

it('blocks responding to an expired proposal', function (): void {
    $consultant = User::factory()->create();
    $proposal = Proposal::factory()->create([
        'user_id'     => $consultant->id,
        'status'      => 'sent',
        'valid_until' => now()->subDay(),
    ]);

    $this->post("/proposta/{$proposal->uuid}/aceitar")
        ->assertRedirect()
        ->assertSessionHas('error');

    expect($proposal->refresh()->status)->toBe('sent');
});

it('marks the public payload as not respondable once expired', function (): void {
    $proposal = Proposal::factory()->create([
        'user_id'     => User::factory(),
        'status'      => 'sent',
        'valid_until' => now()->subDay(),
    ]);

    $this->get("/proposta/{$proposal->uuid}")
        ->assertInertia(fn ($page) => $page
            ->where('proposal.is_expired', true)
            ->where('proposal.is_respondable', false));
});
