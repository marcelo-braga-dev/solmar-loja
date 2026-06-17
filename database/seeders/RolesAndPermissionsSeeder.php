<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Customers\Models\Customer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

final class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Permissões granulares
        $permissions = [
            'products.view', 'products.create', 'products.update', 'products.delete', 'products.publish',
            'categories.view', 'categories.create', 'categories.update', 'categories.delete',
            'brands.view', 'brands.create', 'brands.update', 'brands.delete',
            'orders.view', 'orders.update', 'orders.refund', 'orders.cancel',
            'customers.view', 'customers.update', 'customers.export',
            'inventory.view', 'inventory.adjust',
            'financial.view', 'financial.export',
            'reports.view', 'reports.export',
            'settings.view', 'settings.update',
            'integrations.view', 'integrations.sync',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Papéis
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::all());

        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $manager->syncPermissions([
            'products.view', 'products.create', 'products.update', 'products.publish',
            'categories.view', 'categories.create', 'categories.update',
            'brands.view', 'brands.create', 'brands.update',
            'orders.view', 'orders.update',
            'customers.view', 'inventory.view', 'reports.view',
            'integrations.view', 'integrations.sync',
        ]);

        $finance = Role::firstOrCreate(['name' => 'finance', 'guard_name' => 'web']);
        $finance->syncPermissions(['orders.view', 'financial.view', 'financial.export', 'reports.view', 'reports.export']);

        $stock = Role::firstOrCreate(['name' => 'stock', 'guard_name' => 'web']);
        $stock->syncPermissions(['products.view', 'inventory.view', 'inventory.adjust', 'orders.view']);

        $support = Role::firstOrCreate(['name' => 'support', 'guard_name' => 'web']);
        $support->syncPermissions(['orders.view', 'customers.view']);

        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'web']);

        // Admin padrão
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@solarhub.com.br'],
            [
                'name' => 'Administrador',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $adminUser->assignRole('admin');

        // Cliente de teste
        $testCustomer = User::firstOrCreate(
            ['email' => 'cliente@solarhub.com.br'],
            [
                'name' => 'Cliente Teste',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );
        $testCustomer->assignRole('customer');
        Customer::firstOrCreate(['user_id' => $testCustomer->id]);
    }
}
