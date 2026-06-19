<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Domains\Auth\Data\AdminUserData;
use App\Domains\Auth\Services\AdminUserService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

final class StoreAdminUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Protegido pelo middleware super-admin
    }

    /** @return array<string, mixed> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'role' => ['required', 'string', 'in:'.implode(',', AdminUserService::STAFF_ROLES)],
        ];
    }

    public function toData(): AdminUserData
    {
        $validated = $this->validated();

        return new AdminUserData(
            name: $validated['name'],
            email: $validated['email'],
            password: $validated['password'],
            role: $validated['role'],
        );
    }
}
