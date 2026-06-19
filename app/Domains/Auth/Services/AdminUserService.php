<?php

declare(strict_types=1);

namespace App\Domains\Auth\Services;

use App\Domains\Auth\Data\AdminUserData;
use App\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

final class AdminUserService
{
    /** @var list<string> */
    public const STAFF_ROLES = ['admin', 'manager', 'finance', 'stock', 'support'];

    /** @return LengthAwarePaginator<int, User> */
    public function paginate(?string $search = null): LengthAwarePaginator
    {
        return User::role(self::STAFF_ROLES)
            ->when($search, fn ($query, $term) => $query->where(function ($q) use ($term): void {
                $q->where('name', 'like', "%{$term}%")
                    ->orWhere('email', 'like', "%{$term}%");
            }))
            ->with('roles')
            ->latest()
            ->paginate(20);
    }

    public function create(AdminUserData $data): User
    {
        $user = User::create([
            'name' => $data->name,
            'email' => $data->email,
            'password' => Hash::make($data->password),
            'email_verified_at' => now(),
        ]);

        $user->assignRole($data->role);

        Log::info('Admin user created', ['user_id' => $user->id, 'role' => $data->role]);

        return $user;
    }

    public function revoke(User $target, User $actor): void
    {
        if ($target->is($actor)) {
            throw ValidationException::withMessages([
                'admin' => ['Você não pode remover seu próprio acesso.'],
            ]);
        }

        if ($target->isSuperAdmin() && User::role('admin')->count() <= 1) {
            throw ValidationException::withMessages([
                'admin' => ['Não é possível remover o último administrador do sistema.'],
            ]);
        }

        $target->syncRoles([]);

        Log::info('Admin user access revoked', ['user_id' => $target->id, 'revoked_by' => $actor->id]);
    }
}
