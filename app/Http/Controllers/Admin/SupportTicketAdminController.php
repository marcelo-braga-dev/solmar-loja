<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Support\Models\SupportReply;
use App\Domains\Support\Models\SupportTicket;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class SupportTicketAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SupportTicket::with('user:id,name,email')
            ->withCount('replies');

        if ($request->string('status')->isNotEmpty()) {
            $query->where('status', $request->string('status'));
        }
        if ($request->string('priority')->isNotEmpty()) {
            $query->where('priority', $request->string('priority'));
        }

        $tickets = $query->latest()->paginate(25);

        $stats = [
            'open'        => SupportTicket::where('status', 'open')->count(),
            'in_progress' => SupportTicket::where('status', 'in_progress')->count(),
            'waiting'     => SupportTicket::where('status', 'waiting')->count(),
            'urgent'      => SupportTicket::where('priority', 'urgent')->where('status', '!=', 'closed')->count(),
        ];

        return Inertia::render('Admin/Tickets/Index', [
            'tickets' => $tickets->through(fn (SupportTicket $t) => [
                'uuid'           => $t->uuid,
                'subject'        => $t->subject,
                'user_name'      => $t->user?->name ?? $t->name,
                'category_label' => $t->categoryLabel(),
                'priority'       => $t->priority,
                'priority_label' => $t->priorityLabel(),
                'status'         => $t->status,
                'status_label'   => $t->statusLabel(),
                'status_color'   => $t->statusColor(),
                'replies_count'  => $t->replies_count,
                'created_at'     => $t->created_at->format('d/m/Y H:i'),
            ]),
            'stats'   => $stats,
            'filters' => $request->only(['status', 'priority']),
        ]);
    }

    public function show(SupportTicket $ticket): Response
    {
        $ticket->load(['user:id,name,email', 'replies.user:id,name']);

        return Inertia::render('Admin/Tickets/Show', [
            'ticket' => [
                'uuid'           => $ticket->uuid,
                'subject'        => $ticket->subject,
                'user_name'      => $ticket->user?->name ?? $ticket->name,
                'user_email'     => $ticket->user?->email ?? $ticket->email,
                'category_label' => $ticket->categoryLabel(),
                'priority'       => $ticket->priority,
                'priority_label' => $ticket->priorityLabel(),
                'status'         => $ticket->status,
                'status_label'   => $ticket->statusLabel(),
                'status_color'   => $ticket->statusColor(),
                'created_at'     => $ticket->created_at->format('d/m/Y H:i'),
                'replies'        => $ticket->replies->map(fn (SupportReply $r) => [
                    'id'         => $r->id,
                    'message'    => $r->message,
                    'is_staff'   => $r->is_staff,
                    'user_name'  => $r->is_staff ? ($r->user?->name ?? 'Equipe') : ($r->user?->name ?? $ticket->name),
                    'created_at' => $r->created_at->format('d/m/Y H:i'),
                ]),
            ],
        ]);
    }

    public function reply(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'min:5', 'max:2000'],
        ]);

        SupportReply::create([
            'ticket_id' => $ticket->id,
            'user_id'   => Auth::id(),
            'message'   => $validated['message'],
            'is_staff'  => true,
        ]);

        $ticket->update(['status' => 'waiting']);

        return back()->with('success', 'Resposta enviada ao cliente.');
    }

    public function updateStatus(Request $request, SupportTicket $ticket): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:open,in_progress,waiting,resolved,closed'],
        ]);

        $ticket->update($validated);

        return back()->with('success', 'Status atualizado.');
    }
}
