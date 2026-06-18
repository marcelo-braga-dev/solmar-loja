<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Settings\Services\SettingsService;
use App\Domains\Support\Models\SupportReply;
use App\Domains\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class SupportTicketController extends Controller
{
    public function __construct(private readonly SettingsService $settings) {}

    public function index(): Response
    {
        $tickets = SupportTicket::where('user_id', Auth::id())
            ->withCount('replies')
            ->latest()
            ->paginate(10);

        return Inertia::render('Storefront/Account/Tickets', [
            'tickets' => $tickets->through(fn (SupportTicket $t) => [
                'uuid' => $t->uuid,
                'subject' => $t->subject,
                'category' => $t->category,
                'category_label' => $t->categoryLabel(),
                'priority' => $t->priority,
                'priority_label' => $t->priorityLabel(),
                'status' => $t->status,
                'status_label' => $t->statusLabel(),
                'status_color' => $t->statusColor(),
                'replies_count' => $t->replies_count,
                'created_at' => $t->created_at->format('d/m/Y H:i'),
            ]),
        ]);
    }

    public function create(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $orders = $user->orders()->latest()->limit(5)->get()->map(fn ($o) => [
            'id' => $o->id,
            'label' => '#'.strtoupper(substr($o->uuid, 0, 8)),
        ]);

        return Inertia::render('Storefront/Account/TicketCreate', [
            'user' => $user->only('name', 'email'),
            'orders' => $orders,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:200'],
            'category' => ['required', 'in:general,technical,order,payment,returns'],
            'priority' => ['required', 'in:low,normal,high,urgent'],
            'message' => ['required', 'string', 'min:20', 'max:2000'],
            'order_id' => ['nullable', 'integer', 'exists:orders,id'],
        ]);

        /** @var User $user */
        $user = Auth::user();

        $ticket = SupportTicket::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'subject' => $validated['subject'],
            'category' => $validated['category'],
            'priority' => $validated['priority'],
            'status' => 'open',
            'order_id' => $validated['order_id'] ?? null,
        ]);

        SupportReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => $user->id,
            'message' => $validated['message'],
            'is_staff' => false,
        ]);

        return to_route('account.tickets.show', $ticket->uuid)
            ->with('success', 'Ticket aberto! Responderemos em até 1 dia útil.');
    }

    public function show(SupportTicket $ticket): Response
    {
        abort_if($ticket->user_id !== Auth::id(), 403);

        $ticket->load('replies.user:id,name');

        $storeName = $this->settings->get('store_name', config('app.name'));

        return Inertia::render('Storefront/Account/TicketShow', [
            'ticket' => [
                'uuid' => $ticket->uuid,
                'subject' => $ticket->subject,
                'category_label' => $ticket->categoryLabel(),
                'priority_label' => $ticket->priorityLabel(),
                'status' => $ticket->status,
                'status_label' => $ticket->statusLabel(),
                'status_color' => $ticket->statusColor(),
                'created_at' => $ticket->created_at->format('d/m/Y H:i'),
                'replies' => $ticket->replies->map(fn (SupportReply $r) => [
                    'id' => $r->id,
                    'message' => $r->message,
                    'is_staff' => $r->is_staff,
                    'user_name' => $r->is_staff ? "Equipe {$storeName}" : ($r->user?->name ?? 'Você'),
                    'created_at' => $r->created_at->format('d/m/Y H:i'),
                ]),
            ],
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        abort_if($ticket->user_id !== Auth::id(), 403);

        $validated = $request->validate([
            'message' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        SupportReply::create([
            'ticket_id' => $ticket->id,
            'user_id' => Auth::id(),
            'message' => $validated['message'],
            'is_staff' => false,
        ]);

        if ($ticket->status === 'waiting') {
            $ticket->update(['status' => 'open']);
        }

        return back()->with('success', 'Resposta enviada.');
    }
}
