<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\Settings\Services\SettingsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Inertia\Inertia;
use Inertia\Response;

final class StaticPageController extends Controller
{
    public function __construct(private readonly SettingsService $settings) {}

    public function sobre(): Response
    {
        return Inertia::render('Storefront/Sobre');
    }

    public function contato(): Response
    {
        return Inertia::render('Storefront/Contato');
    }

    public function contatoStore(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'subject' => ['required', 'string', 'max:200'],
            'message' => ['required', 'string', 'min:20', 'max:2000'],
        ]);

        Log::info('Contato recebido', [
            'name' => $request->string('name'),
            'email' => $request->string('email'),
            'subject' => $request->string('subject'),
        ]);

        // Envia e-mail para a loja
        Mail::raw(
            "De: {$request->string('name')} <{$request->string('email')}>\n"
            ."Tel: {$request->string('phone', 'Não informado')}\n\n"
            .$request->string('message'),
            function ($msg) use ($request): void {
                $storeName = $this->settings->get('store_name', config('app.name'));
                $msg->to(config('mail.from.address'))
                    ->subject("[{$storeName} Contato] {$request->string('subject')}");
            },
        );

        return back()->with('success', 'Mensagem enviada! Responderemos em até 1 dia útil.');
    }

    public function privacidade(): Response
    {
        return Inertia::render('Storefront/Privacidade');
    }

    public function vagas(): Response
    {
        return Inertia::render('Storefront/Vagas');
    }

    public function ajuda(): Response
    {
        return Inertia::render('Storefront/Ajuda');
    }
}
