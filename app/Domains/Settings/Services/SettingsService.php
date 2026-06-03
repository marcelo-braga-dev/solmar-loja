<?php

declare(strict_types=1);

namespace App\Domains\Settings\Services;

use App\Domains\Settings\Models\Setting;
use Illuminate\Support\Facades\Cache;

final class SettingsService
{
    private const CACHE_KEY = 'app_settings';
    private const CACHE_TTL = 3600;

    public function get(string $key, mixed $default = null): mixed
    {
        $settings = $this->all();

        return $settings[$key] ?? $default;
    }

    /** @return array<string, mixed> */
    public function all(): array
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_TTL, function (): array {
            return Setting::all()->mapWithKeys(
                fn (Setting $s) => [$s->key => $s->typedValue()]
            )->toArray();
        });
    }

    public function set(string $key, mixed $value): void
    {
        Setting::where('key', $key)->update(['value' => is_array($value) ? json_encode($value) : $value]);
        $this->clearCache();
    }

    /** @param array<string, mixed> $data */
    public function setMany(array $data): void
    {
        foreach ($data as $key => $value) {
            Setting::where('key', $key)->update(['value' => is_array($value) ? json_encode($value) : $value]);
        }
        $this->clearCache();
    }

    public function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }

    /** @return array<string, Setting[]> */
    public function grouped(): array
    {
        return Setting::all()->groupBy('group')->toArray();
    }
}
