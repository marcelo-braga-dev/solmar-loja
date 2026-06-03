<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Marketing\Models\NewsletterSubscriber;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

final class NewsletterAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $subscribers = NewsletterSubscriber::query()
            ->when($request->string('status')->isNotEmpty(), function ($q) use ($request): void {
                match ($request->string('status')->value()) {
                    'active'       => $q->active(),
                    'unconfirmed'  => $q->where('confirmed', false),
                    'unsubscribed' => $q->whereNotNull('unsubscribed_at'),
                    default        => null,
                };
            })
            ->when($request->string('q')->isNotEmpty(), fn ($q) => $q->where('email', 'like', '%' . $request->string('q') . '%'))
            ->orderByDesc('created_at')
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('Admin/Newsletter/Index', [
            'subscribers' => $subscribers,
            'filters'     => $request->only(['status', 'q']),
            'stats'       => [
                'total'        => NewsletterSubscriber::count(),
                'active'       => NewsletterSubscriber::active()->count(),
                'unconfirmed'  => NewsletterSubscriber::where('confirmed', false)->count(),
                'unsubscribed' => NewsletterSubscriber::whereNotNull('unsubscribed_at')->count(),
            ],
        ]);
    }

    public function destroy(NewsletterSubscriber $subscriber): RedirectResponse
    {
        $subscriber->delete();

        return back()->with('success', 'Inscrito removido.');
    }

    public function exportCsv(): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $filename = 'newsletter_subscribers_' . now()->format('Y-m-d') . '.csv';

        return response()->streamDownload(function (): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['E-mail', 'Nome', 'Status', 'Confirmado em', 'Inscrito em'], ';');

            NewsletterSubscriber::active()
                ->orderBy('confirmed_at')
                ->chunk(500, function ($subscribers) use ($handle): void {
                    foreach ($subscribers as $sub) {
                        fputcsv($handle, [
                            $sub->email,
                            $sub->name ?? '',
                            $sub->isActive() ? 'Ativo' : 'Inativo',
                            $sub->confirmed_at?->format('d/m/Y') ?? '',
                            $sub->created_at->format('d/m/Y'),
                        ], ';');
                    }
                });

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
