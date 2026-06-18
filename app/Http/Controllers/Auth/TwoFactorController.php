<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Domains\Auth\Services\TwoFactorService;
use App\Domains\Settings\Services\SettingsService;
use App\Http\Controllers\Controller;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FAQRCode\Google2FA as Google2FAQRCode;
use PragmaRX\Google2FAQRCode\QRCode\Bacon as BaconQrCodeService;

final class TwoFactorController extends Controller
{
    public function __construct(
        private readonly TwoFactorService $twoFactorService,
        private readonly SettingsService $settings,
    ) {}

    public function setup(Request $request): Response
    {
        $user = $request->user();
        $secret = null;
        $qrCode = null;

        if (! $user->hasTwoFactorEnabled()) {
            $secret = $this->twoFactorService->generateSecret();

            session(['two_factor_setup_secret' => $secret]);

            $g2fa = new Google2FAQRCode(new BaconQrCodeService(new SvgImageBackEnd));

            $qrCode = $g2fa->getQRCodeInline(
                $this->settings->get('store_name', config('app.name')),
                $user->email,
                $secret,
            );
        }

        return Inertia::render('Auth/TwoFactor/Setup', [
            'enabled' => $user->hasTwoFactorEnabled(),
            'secret' => $secret,
            'qrCode' => $qrCode ?? null,
            'recoveryCodes' => $user->hasTwoFactorEnabled()
                ? $this->twoFactorService->getRecoveryCodes($user)
                : [],
        ]);
    }

    public function enable(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'digits:6'],
        ]);

        $user = $request->user();
        $secret = session('two_factor_setup_secret');

        if (! $secret || ! $this->twoFactorService->enable($user, $secret, $request->string('code')->value())) {
            return back()->withErrors(['code' => 'Código inválido. Verifique o aplicativo autenticador.']);
        }

        session()->forget('two_factor_setup_secret');

        return redirect()->route('two-factor.setup')
            ->with('success', 'Autenticação em dois fatores ativada com sucesso!');
    }

    public function disable(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'string', 'current_password'],
        ]);

        $this->twoFactorService->disable($request->user());

        return redirect()->route('two-factor.setup')
            ->with('success', 'Autenticação em dois fatores desativada.');
    }

    public function challenge(): Response
    {
        return Inertia::render('Auth/TwoFactor/Challenge');
    }

    public function verify(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string'],
        ]);

        $user = $request->user();
        $code = $request->string('code')->value();

        $verified = strlen($code) === 6
            ? $this->twoFactorService->verifyForUser($user, $code)
            : $this->twoFactorService->verifyRecoveryCode($user, $code);

        if (! $verified) {
            return back()->withErrors(['code' => 'Código inválido. Tente novamente.']);
        }

        session(['two_factor_confirmed' => true]);

        return redirect()->intended(route('admin.dashboard'));
    }
}
