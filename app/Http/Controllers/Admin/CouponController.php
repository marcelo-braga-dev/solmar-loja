<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Marketing\Models\Coupon;
use App\Domains\Marketing\Services\CouponService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class CouponController extends Controller
{
    public function __construct(
        private readonly CouponService $couponService,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Coupons/Index', [
            'coupons' => $this->couponService->paginate()->through(fn (Coupon $c) => [
                'id'              => $c->id,
                'code'            => $c->code,
                'type'            => $c->type,
                'value'           => $c->value,
                'min_order_cents' => $c->min_order_cents,
                'max_uses'        => $c->max_uses,
                'used_count'      => $c->used_count,
                'is_active'       => $c->is_active,
                'is_valid'        => $c->isValid(),
                'expires_at'      => $c->expires_at?->format('d/m/Y'),
            ]),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'code'            => ['required', 'string', 'max:50', 'unique:coupons,code'],
            'type'            => ['required', 'in:percentage,fixed,free_shipping'],
            'value'           => ['required', 'integer', 'min:0'],
            'min_order_cents' => ['integer', 'min:0'],
            'max_uses'        => ['nullable', 'integer', 'min:1'],
            'starts_at'       => ['nullable', 'date'],
            'expires_at'      => ['nullable', 'date', 'after:today'],
            'is_active'       => ['boolean'],
        ]);

        $this->couponService->create($validated);

        return back()->with('success', 'Cupom criado com sucesso.');
    }

    public function toggle(Coupon $coupon): RedirectResponse
    {
        $this->couponService->toggle($coupon);

        return back()->with('success', $coupon->is_active ? 'Cupom desativado.' : 'Cupom ativado.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $this->couponService->delete($coupon);

        return back()->with('success', 'Cupom excluído.');
    }
}
