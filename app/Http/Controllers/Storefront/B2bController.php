<?php

declare(strict_types=1);

namespace App\Http\Controllers\Storefront;

use App\Domains\B2b\Models\Company;
use App\Domains\B2b\Models\CompanyProject;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class B2bController extends Controller
{
    /** Página de apresentação / cadastro do Portal B2B */
    public function landing(): Response
    {
        $user = Auth::user();
        $company = $user?->company_id
            ? Company::with('priceList')->find($user->company_id)
            : null;

        return Inertia::render('Storefront/B2b/Landing', [
            'user_company' => $company ? [
                'razao_social' => $company->razao_social,
                'status'       => $company->status,
                'status_label' => $company->statusLabel(),
                'status_color' => $company->statusColor(),
                'price_list'   => $company->priceList?->name,
            ] : null,
        ]);
    }

    /** Formulário de cadastro de empresa */
    public function register(): Response
    {
        return Inertia::render('Storefront/B2b/Register');
    }

    /** Processa o cadastro da empresa */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'razao_social'       => ['required', 'string', 'max:150'],
            'nome_fantasia'      => ['nullable', 'string', 'max:100'],
            'cnpj'               => ['required', 'string', 'unique:companies,cnpj'],
            'inscricao_estadual' => ['nullable', 'string', 'max:30'],
            'type'               => ['required', 'in:integrador,distribuidor,engenharia,revendedor,other'],
            'segment'            => ['nullable', 'string', 'max:60'],
            'contact_name'       => ['required', 'string', 'max:100'],
            'contact_email'      => ['required', 'email'],
            'contact_phone'      => ['nullable', 'string', 'max:20'],
            'contact_whatsapp'   => ['nullable', 'string', 'max:20'],
            'cep'                => ['nullable', 'string', 'max:9'],
            'street'             => ['nullable', 'string', 'max:150'],
            'number'             => ['nullable', 'string', 'max:10'],
            'complement'         => ['nullable', 'string', 'max:60'],
            'district'           => ['nullable', 'string', 'max:80'],
            'city'               => ['nullable', 'string', 'max:80'],
            'state'              => ['nullable', 'string', 'max:2'],
            'website'            => ['nullable', 'url', 'max:200'],
        ]);

        $company = Company::create(array_merge($validated, ['status' => 'pending']));

        // Vincular o usuário atual à empresa
        /** @var \App\Models\User $user */
        $user = Auth::user();
        $company->users()->attach($user->id, ['role' => 'owner', 'is_primary_contact' => true]);
        $user->update(['company_id' => $company->id]);

        // Notificar admins sobre nova empresa aguardando aprovação
        try {
            \App\Models\User::role('admin')->each(function ($admin) use ($company): void {
                $admin->notify(new \App\Notifications\NewCompanyRegistrationNotification($company));
            });
        } catch (\Throwable) {}

        return to_route('b2b.dashboard')
            ->with('success', 'Empresa cadastrada! Nossa equipe analisará em até 1 dia útil.');
    }

    /** Dashboard da empresa (para o usuário logado membro de uma empresa) */
    public function dashboard(): Response
    {
        /** @var \App\Models\User $user */
        $user = Auth::user();

        $company = Company::with(['priceList', 'users', 'projects' => fn ($q) => $q->latest()->limit(5)])
            ->find($user->company_id);

        abort_if(! $company, 404);

        return Inertia::render('Storefront/B2b/Dashboard', [
            'company' => [
                'razao_social'      => $company->razao_social,
                'nome_fantasia'     => $company->nome_fantasia,
                'cnpj'              => $company->cnpj,
                'type_label'        => $company->typeLabel(),
                'status'            => $company->status,
                'status_label'      => $company->statusLabel(),
                'status_color'      => $company->statusColor(),
                'price_list'        => $company->priceList
                    ? ['name' => $company->priceList->name, 'discount_percent' => $company->priceList->discount_percent]
                    : null,
                'credit_limit_cents'   => $company->credit_limit_cents,
                'payment_term_days'    => $company->payment_term_days,
                'extra_discount_pct'   => $company->extra_discount_pct,
                'users_count'          => $company->users->count(),
                'projects_count'       => $company->projects()->count(),
                'active_projects'      => $company->projects()->where('status', 'in_progress')->count(),
            ],
            'recent_projects' => $company->projects->map(fn (CompanyProject $p) => [
                'id'                  => $p->id,
                'name'                => $p->name,
                'client_name'         => $p->client_name,
                'city'                => $p->city,
                'state'               => $p->state,
                'type_label'          => $p->typeLabel(),
                'status'              => $p->status,
                'status_label'        => $p->statusLabel(),
                'system_kwp'          => $p->system_kwp,
                'contract_value_cents'=> $p->contract_value_cents,
            ]),
        ]);
    }

    /** Lista de projetos da empresa */
    public function projects(): Response
    {
        /** @var \App\Models\User $user */
        $user    = Auth::user();
        $company = Company::find($user->company_id);
        abort_if(! $company, 404);

        $projects = $company->projects()->latest()->paginate(20);

        return Inertia::render('Storefront/B2b/Projects', [
            'company_name' => $company->razao_social,
            'projects'     => $projects->through(fn (CompanyProject $p) => [
                'id'                   => $p->id,
                'name'                 => $p->name,
                'client_name'          => $p->client_name,
                'city'                 => $p->city,
                'state'                => $p->state,
                'type_label'           => $p->typeLabel(),
                'status'               => $p->status,
                'status_label'         => $p->statusLabel(),
                'system_kwp'           => $p->system_kwp,
                'contract_value_cents' => $p->contract_value_cents,
                'started_at'           => $p->started_at?->format('d/m/Y'),
                'completed_at'         => $p->completed_at?->format('d/m/Y'),
            ]),
        ]);
    }

    /** Cria/atualiza um projeto da empresa */
    public function storeProject(Request $request): RedirectResponse
    {
        /** @var \App\Models\User $user */
        $user    = Auth::user();
        $company = Company::findOrFail($user->company_id);

        $validated = $request->validate([
            'name'                  => ['required', 'string', 'max:150'],
            'client_name'           => ['nullable', 'string', 'max:120'],
            'city'                  => ['nullable', 'string', 'max:80'],
            'state'                 => ['nullable', 'string', 'max:2'],
            'type'                  => ['nullable', 'in:residencial,comercial,industrial,rural'],
            'system_kwp'            => ['nullable', 'numeric', 'min:0'],
            'started_at'            => ['nullable', 'date'],
            'contract_value_cents'  => ['nullable', 'integer', 'min:0'],
            'notes'                 => ['nullable', 'string', 'max:1000'],
        ]);

        $company->projects()->create(array_merge($validated, ['status' => 'prospect']));

        return back()->with('success', 'Projeto cadastrado.');
    }
}
