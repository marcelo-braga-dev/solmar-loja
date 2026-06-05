<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Orders\Models\Quote;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class QuoteAdminController extends Controller
{
    public function index(): Response
    {
        $quotes = Quote::with('user:id,name,email')
            ->latest()
            ->paginate(20);

        $stats = [
            'pending'  => Quote::where('status', 'pending')->count(),
            'total'    => Quote::count(),
            'accepted' => Quote::where('status', 'accepted')->count(),
        ];

        return Inertia::render('Admin/Quotes/Index', [
            'quotes' => $quotes->through(fn (Quote $q) => [
                'uuid'         => $q->uuid,
                'name'         => $q->name,
                'email'        => $q->email,
                'company'      => $q->company,
                'status'       => $q->status,
                'status_label' => $q->statusLabel(),
                'status_color' => $q->statusColor(),
                'items_count'  => count($q->items ?? []),
                'total_cents'  => collect($q->items ?? [])->sum(fn ($i) => $i['price_cents'] * $i['qty']),
                'created_at'   => $q->created_at->format('d/m/Y H:i'),
            ]),
            'stats' => $stats,
        ]);
    }

    public function show(Quote $quote): Response
    {
        return Inertia::render('Admin/Quotes/Show', [
            'quote' => [
                'uuid'                => $quote->uuid,
                'name'                => $quote->name,
                'email'               => $quote->email,
                'phone'               => $quote->phone,
                'company'             => $quote->company,
                'cnpj'                => $quote->cnpj,
                'message'             => $quote->message,
                'items'               => $quote->items,
                'status'              => $quote->status,
                'status_label'        => $quote->statusLabel(),
                'status_color'        => $quote->statusColor(),
                'quoted_total_cents'  => $quote->quoted_total_cents,
                'discount_percent'    => $quote->discount_percent,
                'admin_notes'         => $quote->admin_notes,
                'expires_at'          => $quote->expires_at?->format('d/m/Y'),
                'created_at'          => $quote->created_at->format('d/m/Y H:i'),
            ],
        ]);
    }

    public function update(Request $request, Quote $quote): RedirectResponse
    {
        $validated = $request->validate([
            'status'             => ['required', 'in:pending,reviewing,sent,accepted,rejected'],
            'quoted_total_cents' => ['nullable', 'integer', 'min:0'],
            'discount_percent'   => ['nullable', 'integer', 'min:0', 'max:100'],
            'admin_notes'        => ['nullable', 'string', 'max:2000'],
            'expires_at'         => ['nullable', 'date'],
        ]);

        $quote->update(array_merge($validated, [
            'responded_at' => $quote->responded_at ?? now(),
        ]));

        return back()->with('success', 'Cotação atualizada.');
    }
}
