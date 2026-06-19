<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Auth\Services\AdminUserService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreAdminUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AdminUserController extends Controller
{
    public function __construct(
        private readonly AdminUserService $adminUsers,
    ) {}

    public function index(Request $request): Response
    {
        $admins = $this->adminUsers->paginate($request->string('q')->value() ?: null);

        return Inertia::render('Admin/Admins/Index', [
            'admins' => $admins->through(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'role' => $u->roles->first()?->name,
                'is_self' => $u->is($request->user()),
                'created_at' => $u->created_at->format('d/m/Y'),
            ]),
            'filters' => $request->only(['q']),
        ]);
    }

    public function store(StoreAdminUserRequest $request): RedirectResponse
    {
        $this->adminUsers->create($request->toData());

        return back()->with('success', 'Administrador cadastrado com sucesso.');
    }

    public function destroy(Request $request, User $admin): RedirectResponse
    {
        $this->adminUsers->revoke($admin, $request->user());

        return back()->with('success', 'Acesso de administrador removido.');
    }
}
