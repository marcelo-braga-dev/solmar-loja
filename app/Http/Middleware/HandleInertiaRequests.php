<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Domains\Orders\Models\Cart;
use App\Domains\Catalog\Services\CategoryService;
use App\Domains\Settings\Services\SettingsService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? array_merge(
                    $request->user()->only('id', 'name', 'email', 'email_verified_at'),
                    ['is_admin' => $request->user()->isAdmin()],
                ) : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error'   => fn () => $request->session()->get('error'),
                'info'    => fn () => $request->session()->get('info'),
                'warning' => fn () => $request->session()->get('warning'),
            ],
            'cartCount'     => fn () => $this->resolveCartCount($request),
            'notifyCount'   => fn () => $this->resolveNotifyCount($request),
            'branding'      => fn () => $this->resolveBranding(),
        ];
    }

    /** @return array<string, string> */
    private function resolveBranding(): array
    {
        try {
            $s = app(SettingsService::class);

            return [
                // Identidade visual
                'store_name'         => $s->get('store_name', 'SolarHub Commerce'),
                'store_tagline'      => $s->get('store_tagline', ''),
                'store_description'  => $s->get('store_description', ''),
                'logo_url'           => $s->get('logo_url', ''),
                'logo_dark_url'      => $s->get('logo_dark_url', ''),
                'favicon_url'        => $s->get('favicon_url', ''),
                'primary_color'      => $s->get('primary_color', '#0B5FFF'),
                'secondary_color'    => $s->get('secondary_color', '#FFB300'),
                'dark_bg_color'      => $s->get('dark_bg_color', '#1A1A2E'),
                // Contato
                'store_email'        => $s->get('store_email', 'contato@solarhub.com.br'),
                'store_phone'        => $s->get('store_phone', ''),
                'store_address'      => $s->get('store_address', ''),
                'store_cnpj'         => $s->get('store_cnpj', ''),
                'footer_text'        => $s->get('footer_text', ''),
                // Redes sociais
                'social_whatsapp'    => $s->get('social_whatsapp', ''),
                'social_instagram'   => $s->get('social_instagram', ''),
                'social_facebook'    => $s->get('social_facebook', ''),
                'social_youtube'     => $s->get('social_youtube', ''),
                'social_linkedin'    => $s->get('social_linkedin', ''),
                // Frete
                'free_shipping_min_cents' => (int) $s->get('free_shipping_min_cents', '200000'),
                'free_shipping_enabled'   => filter_var($s->get('free_shipping_enabled', 'true'), FILTER_VALIDATE_BOOLEAN),
            ];
        } catch (\Throwable) {
            return [
                'store_name'              => 'SolarHub Commerce',
                'store_email'             => 'contato@solarhub.com.br',
                'store_phone'             => '',
                'logo_url'                => '',
                'primary_color'           => '#0B5FFF',
                'secondary_color'         => '#FFB300',
                'dark_bg_color'           => '#1A1A2E',
                'free_shipping_min_cents' => 200000,
                'free_shipping_enabled'   => true,
            ];
        }
    }

    private function resolveNotifyCount(Request $request): int
    {
        try {
            $user = $request->user();

            if (! $user?->isAdmin()) {
                return 0;
            }

            return $user->unreadNotifications()->count();
        } catch (\Throwable) {
            return 0;
        }
    }

    private function resolveCartCount(Request $request): int
    {
        try {
            $userId    = $request->user()?->id;
            $sessionId = $request->session()->getId();

            $cart = $userId
                ? Cart::where('user_id', $userId)->first()
                : Cart::where('session_id', $sessionId)->first();

            return $cart?->items()->sum('quantity') ?? 0;
        } catch (\Throwable) {
            return 0;
        }
    }
}
