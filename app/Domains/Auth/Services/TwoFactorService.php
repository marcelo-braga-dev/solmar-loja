<?php

declare(strict_types=1);

namespace App\Domains\Auth\Services;

use App\Domains\Settings\Services\SettingsService;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

final class TwoFactorService
{
    public function __construct(
        private readonly Google2FA $google2fa,
        private readonly SettingsService $settings,
    ) {}

    public function generateSecret(): string
    {
        return $this->google2fa->generateSecretKey();
    }

    public function getQrCodeUrl(User $user, string $secret): string
    {
        return $this->google2fa->getQRCodeUrl(
            company: $this->settings->get('store_name', config('app.name')),
            holder: $user->email,
            secret: $secret,
        );
    }

    /** @return array<string> */
    public function generateRecoveryCodes(): array
    {
        return Collection::times(8, fn () => Str::random(10).'-'.Str::random(10))->all();
    }

    public function enable(User $user, string $secret, string $code): bool
    {
        if (! $this->verify($secret, $code)) {
            return false;
        }

        $user->update([
            'two_factor_secret' => encrypt($secret),
            'two_factor_recovery_codes' => encrypt(json_encode($this->generateRecoveryCodes())),
            'two_factor_confirmed_at' => now(),
        ]);

        return true;
    }

    public function disable(User $user): void
    {
        $user->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        session()->forget('two_factor_confirmed');
    }

    public function verify(string $secret, string $code): bool
    {
        return (bool) $this->google2fa->verifyKey($secret, $code);
    }

    public function verifyForUser(User $user, string $code): bool
    {
        if ($user->two_factor_secret === null) {
            return false;
        }

        $secret = decrypt($user->two_factor_secret);

        return $this->verify($secret, $code);
    }

    public function verifyRecoveryCode(User $user, string $code): bool
    {
        if ($user->two_factor_recovery_codes === null) {
            return false;
        }

        /** @var array<string> $codes */
        $codes = json_decode(decrypt($user->two_factor_recovery_codes), true);

        $index = array_search($code, $codes, true);

        if ($index === false) {
            return false;
        }

        unset($codes[$index]);

        $user->update([
            'two_factor_recovery_codes' => encrypt(json_encode(array_values($codes))),
        ]);

        return true;
    }

    /** @return array<string> */
    public function getRecoveryCodes(User $user): array
    {
        if ($user->two_factor_recovery_codes === null) {
            return [];
        }

        return json_decode(decrypt($user->two_factor_recovery_codes), true);
    }

    public function getDecryptedSecret(User $user): ?string
    {
        if ($user->two_factor_secret === null) {
            return null;
        }

        return decrypt($user->two_factor_secret);
    }
}
