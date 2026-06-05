<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Orders\Models\ReturnRequest;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class ReturnAdminController extends Controller
{
    public function index(): Response
    {
        $returns = ReturnRequest::with(['user:id,name,email', 'order:id,uuid'])
            ->latest()
            ->paginate(20);

        $stats = [
            'requested' => ReturnRequest::where('status', 'requested')->count(),
            'approved'  => ReturnRequest::where('status', 'approved')->count(),
            'total'     => ReturnRequest::count(),
        ];

        return Inertia::render('Admin/Returns/Index', [
            'returns' => $returns->through(fn (ReturnRequest $r) => [
                'uuid'         => $r->uuid,
                'user_name'    => $r->user?->name,
                'user_email'   => $r->user?->email,
                'order_uuid'   => $r->order?->uuid,
                'reason'       => $r->reason,
                'status'       => $r->status,
                'status_label' => $r->statusLabel(),
                'status_color' => $r->statusColor(),
                'items_count'  => count($r->items ?? []),
                'created_at'   => $r->created_at->format('d/m/Y H:i'),
            ]),
            'stats' => $stats,
        ]);
    }

    public function show(ReturnRequest $return): Response
    {
        $return->load(['user:id,name,email', 'order:id,uuid,total_cents,placed_at']);

        return Inertia::render('Admin/Returns/Show', [
            'return' => [
                'uuid'                => $return->uuid,
                'user_name'           => $return->user?->name,
                'user_email'          => $return->user?->email,
                'order_uuid'          => $return->order?->uuid,
                'reason'              => $return->reason,
                'description'         => $return->description,
                'items'               => $return->items,
                'images'              => $return->images ?? [],
                'status'              => $return->status,
                'status_label'        => $return->statusLabel(),
                'status_color'        => $return->statusColor(),
                'refund_amount_cents' => $return->refund_amount_cents,
                'refund_method'       => $return->refund_method,
                'admin_notes'         => $return->admin_notes,
                'approved_at'         => $return->approved_at?->format('d/m/Y'),
                'received_at'         => $return->received_at?->format('d/m/Y'),
                'refunded_at'         => $return->refunded_at?->format('d/m/Y'),
                'created_at'          => $return->created_at->format('d/m/Y H:i'),
            ],
        ]);
    }

    public function updateStatus(Request $request, ReturnRequest $return): RedirectResponse
    {
        $validated = $request->validate([
            'status'              => ['required', 'in:requested,approved,rejected,received,refunded'],
            'refund_amount_cents' => ['nullable', 'integer', 'min:0'],
            'refund_method'       => ['nullable', 'in:original,credit,bank_transfer'],
            'admin_notes'         => ['nullable', 'string', 'max:1000'],
        ]);

        $updates = $validated;

        if ($validated['status'] === 'approved' && ! $return->approved_at) {
            $updates['approved_at'] = now();
        }
        if ($validated['status'] === 'received' && ! $return->received_at) {
            $updates['received_at'] = now();
        }
        if ($validated['status'] === 'refunded' && ! $return->refunded_at) {
            $updates['refunded_at'] = now();
        }

        $return->update($updates);

        return back()->with('success', 'Status da devolução atualizado.');
    }
}
