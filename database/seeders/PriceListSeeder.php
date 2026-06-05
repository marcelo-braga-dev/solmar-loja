<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Catalog\Models\PriceList;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class PriceListSeeder extends Seeder
{
    public function run(): void
    {
        // ── Tabelas de Preço ──────────────────────────────────────────────────
        $lists = [
            [
                'name'             => 'Preço Público',
                'code'             => 'PUBLICO',
                'description'      => 'Tabela padrão exibida na loja para todos os visitantes.',
                'type'             => 'retail',
                'discount_percent' => 0,
                'is_default'       => true,
                'is_active'        => true,
                'is_public'        => true,
            ],
            [
                'name'             => 'Consultor',
                'code'             => 'CONSULTOR',
                'description'      => 'Tabela exclusiva para consultores credenciados. 12% de desconto sobre preço público.',
                'type'             => 'consultant',
                'discount_percent' => 12,
                'is_default'       => false,
                'is_active'        => true,
                'is_public'        => false,
            ],
            [
                'name'             => 'Integrador',
                'code'             => 'INTEGRADOR',
                'description'      => 'Tabela para integradores e instaladores de sistemas fotovoltaicos. 18% sobre preço público.',
                'type'             => 'wholesale',
                'discount_percent' => 18,
                'is_default'       => false,
                'is_active'        => true,
                'is_public'        => false,
            ],
            [
                'name'             => 'Distribuidor',
                'code'             => 'DISTRIB',
                'description'      => 'Tabela para distribuidores regionais com alto volume. 25% sobre preço público.',
                'type'             => 'wholesale',
                'discount_percent' => 25,
                'is_default'       => false,
                'is_active'        => true,
                'is_public'        => false,
            ],
        ];

        foreach ($lists as $list) {
            PriceList::firstOrCreate(['code' => $list['code']], $list);
        }

        $consultorList = PriceList::where('code', 'CONSULTOR')->first();

        // ── Role: consultant ──────────────────────────────────────────────────
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Permissões específicas de proposta (criar se não existirem)
        $proposalPerms = ['proposals.view', 'proposals.create', 'proposals.update', 'proposals.delete', 'proposals.send'];
        foreach ($proposalPerms as $perm) {
            Permission::firstOrCreate(['name' => $perm, 'guard_name' => 'web']);
        }

        // Dar permissões de proposta ao admin também
        $admin = Role::findByName('admin');
        $admin->givePermissionTo($proposalPerms);

        // Role consultor
        $consultant = Role::firstOrCreate(['name' => 'consultant', 'guard_name' => 'web']);
        $consultant->syncPermissions([
            'products.view',
            'categories.view',
            'brands.view',
            'orders.view', 'orders.update',
            'customers.view',
            'inventory.view',
            'reports.view',
            'proposals.view', 'proposals.create', 'proposals.update', 'proposals.send',
        ]);

        // ── Usuário consultor de exemplo ──────────────────────────────────────
        $consultorUser = \App\Models\User::firstOrCreate(
            ['email' => 'consultor@solarhub.com.br'],
            [
                'name'              => 'Consultor Comercial',
                'password'          => Hash::make('password'),
                'email_verified_at' => now(),
                'price_list_id'     => $consultorList?->id,
            ]
        );
        $consultorUser->assignRole('consultant');

        // Criar perfil de consultor
        \App\Domains\Consultant\Models\ConsultantProfile::firstOrCreate(
            ['user_id' => $consultorUser->id],
            [
                'phone'              => '(11) 99999-0001',
                'region'             => 'São Paulo',
                'commission_pct'     => 5.00,
                'price_list_id'      => $consultorList?->id,
                'monthly_goal_cents' => 5000000, // R$ 50.000/mês
                'proposal_goal'      => 20,
            ]
        );
    }
}
