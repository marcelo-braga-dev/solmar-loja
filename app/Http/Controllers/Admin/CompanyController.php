<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\B2b\Models\Company;
use App\Domains\B2b\Models\CompanyProject;
use App\Domains\Catalog\Models\PriceList;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class CompanyController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Company::with('priceList')
            ->withCount(['users', 'projects']);

        if ($request->string('status')->isNotEmpty()) {
            $query->where('status', $request->string('status'));
        }
        if ($request->string('q')->isNotEmpty()) {
            $q = $request->string('q');
            $query->where(fn ($qb) =>
                $qb->where('razao_social', 'like', "%{$q}%")
                   ->orWhere('cnpj', 'like', "%{$q}%")
                   ->orWhere('contact_name', 'like', "%{$q}%")
            );
        }

        $companies = $query->latest()->paginate(20);

        $stats = [
            'pending'   => Company::where('status', 'pending')->count(),
            'active'    => Company::where('status', 'active')->count(),
            'total'     => Company::count(),
        ];

        return Inertia::render('Admin/Companies/Index', [
            'companies' => $companies->through(fn (Company $c) => [
                'uuid'          => $c->uuid,
                'razao_social'  => $c->razao_social,
                'nome_fantasia' => $c->nome_fantasia,
                'cnpj'          => $c->cnpj,
                'type'          => $c->type,
                'type_label'    => $c->typeLabel(),
                'city'          => $c->city,
                'state'         => $c->state,
                'status'        => $c->status,
                'status_label'  => $c->statusLabel(),
                'status_color'  => $c->statusColor(),
                'price_list'    => $c->priceList?->name,
                'users_count'   => $c->users_count,
                'projects_count'=> $c->projects_count,
                'approved_at'   => $c->approved_at?->format('d/m/Y'),
                'created_at'    => $c->created_at->format('d/m/Y'),
            ]),
            'stats'   => $stats,
            'filters' => $request->only(['status', 'q']),
        ]);
    }

    public function show(Company $company): Response
    {
        $company->load(['users', 'priceList', 'approvedBy', 'projects' => fn ($q) => $q->latest()]);

        return Inertia::render('Admin/Companies/Show', [
            'company' => [
                'uuid'               => $company->uuid,
                'razao_social'       => $company->razao_social,
                'nome_fantasia'      => $company->nome_fantasia,
                'cnpj'               => $company->cnpj,
                'inscricao_estadual' => $company->inscricao_estadual,
                'type'               => $company->type,
                'type_label'         => $company->typeLabel(),
                'segment'            => $company->segment,
                'status'             => $company->status,
                'status_label'       => $company->statusLabel(),
                'status_color'       => $company->statusColor(),
                'rejection_reason'   => $company->rejection_reason,
                'contact_name'       => $company->contact_name,
                'contact_email'      => $company->contact_email,
                'contact_phone'      => $company->contact_phone,
                'contact_whatsapp'   => $company->contact_whatsapp,
                'cep'                => $company->cep,
                'street'             => $company->street,
                'number'             => $company->number,
                'complement'         => $company->complement,
                'district'           => $company->district,
                'city'               => $company->city,
                'state'              => $company->state,
                'price_list_id'      => $company->price_list_id,
                'price_list_name'    => $company->priceList?->name,
                'credit_limit_cents' => $company->credit_limit_cents,
                'payment_term_days'  => $company->payment_term_days,
                'extra_discount_pct' => $company->extra_discount_pct,
                'website'            => $company->website,
                'approved_at'        => $company->approved_at?->format('d/m/Y H:i'),
                'approved_by'        => $company->approvedBy?->name,
                'notes'              => $company->notes,
                'created_at'         => $company->created_at->format('d/m/Y H:i'),
                'users'              => $company->users->map(fn ($u) => [
                    'id'   => $u->id,
                    'name' => $u->name,
                    'email'=> $u->email,
                    'role' => $u->pivot->role,
                ]),
                'projects' => $company->projects->map(fn (CompanyProject $p) => [
                    'id'                    => $p->id,
                    'name'                  => $p->name,
                    'client_name'           => $p->client_name,
                    'city'                  => $p->city,
                    'state'                 => $p->state,
                    'type_label'            => $p->typeLabel(),
                    'system_kwp'            => $p->system_kwp,
                    'status'                => $p->status,
                    'status_label'          => $p->statusLabel(),
                    'contract_value_cents'  => $p->contract_value_cents,
                    'started_at'            => $p->started_at?->format('d/m/Y'),
                    'completed_at'          => $p->completed_at?->format('d/m/Y'),
                ]),
            ],
            'price_lists' => PriceList::active()->get(['id', 'name', 'code', 'discount_percent']),
        ]);
    }

    public function approve(Company $company): RedirectResponse
    {
        // Define a tabela de preço baseada no tipo da empresa
        $priceListCode = match ($company->type) {
            'integrador'   => 'INTEGRADOR',
            'distribuidor' => 'DISTRIB',
            default        => 'INTEGRADOR',
        };

        $priceList = PriceList::where('code', $priceListCode)->first();

        $company->update([
            'status'        => 'active',
            'approved_at'   => now(),
            'approved_by'   => Auth::id(),
            'price_list_id' => $priceList?->id ?? $company->price_list_id,
        ]);

        // Atualizar price_list_id dos usuários da empresa
        if ($priceList) {
            $company->users()->each(fn (User $u) => $u->update(['price_list_id' => $priceList->id]));
        }

        return back()->with('success', "Empresa {$company->razao_social} aprovada. Tabela de preço: {$priceList?->name}.");
    }

    public function reject(Request $request, Company $company): RedirectResponse
    {
        $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $company->update([
            'status'           => 'rejected',
            'rejection_reason' => $request->string('reason')->value() ?: null,
        ]);

        return back()->with('success', 'Empresa reprovada.');
    }

    public function suspend(Company $company): RedirectResponse
    {
        $company->update(['status' => 'suspended']);

        return back()->with('success', 'Empresa suspensa.');
    }

    public function updateCommercial(Request $request, Company $company): RedirectResponse
    {
        $validated = $request->validate([
            'price_list_id'      => ['nullable', 'integer', 'exists:price_lists,id'],
            'credit_limit_cents' => ['nullable', 'integer', 'min:0'],
            'payment_term_days'  => ['nullable', 'integer', 'min:0', 'max:365'],
            'extra_discount_pct' => ['nullable', 'integer', 'min:0', 'max:50'],
            'notes'              => ['nullable', 'string', 'max:1000'],
        ]);

        $company->update($validated);

        // Propagar price_list para usuários da empresa
        if (isset($validated['price_list_id'])) {
            $company->users()->each(fn (User $u) => $u->update(['price_list_id' => $validated['price_list_id']]));
        }

        return back()->with('success', 'Condições comerciais atualizadas.');
    }
}
