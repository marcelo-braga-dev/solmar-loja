<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Settings\Models\Setting;
use App\Domains\Settings\Services\SettingsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

final class BrandingController extends Controller
{
    /** @var array<string, array{label: string, group: string}> */
    private const FIELD_META = [
        'primary_color' => ['label' => 'Cor primária', 'group' => 'branding'],
        'secondary_color' => ['label' => 'Cor secundária', 'group' => 'branding'],
        'accent_color' => ['label' => 'Cor de destaque', 'group' => 'branding'],
        'dark_bg_color' => ['label' => 'Cor de fundo escuro', 'group' => 'branding'],
        'social_instagram' => ['label' => 'Instagram', 'group' => 'social'],
        'social_facebook' => ['label' => 'Facebook', 'group' => 'social'],
        'social_youtube' => ['label' => 'YouTube', 'group' => 'social'],
        'social_whatsapp' => ['label' => 'WhatsApp', 'group' => 'social'],
        'social_linkedin' => ['label' => 'LinkedIn', 'group' => 'social'],
        'footer_text' => ['label' => 'Texto do rodapé', 'group' => 'branding'],
        'logo_url' => ['label' => 'Logo (fundo claro)', 'group' => 'branding'],
        'logo_dark_url' => ['label' => 'Logo (fundo escuro)', 'group' => 'branding'],
        'favicon_url' => ['label' => 'Favicon', 'group' => 'branding'],
    ];

    public function __construct(private readonly SettingsService $settings) {}

    public function index(): Response
    {
        $keys = [
            'logo_url', 'logo_dark_url', 'favicon_url',
            'primary_color', 'secondary_color', 'accent_color', 'dark_bg_color',
            'social_instagram', 'social_facebook', 'social_youtube', 'social_whatsapp', 'social_linkedin',
            'footer_text',
        ];

        $branding = [];

        foreach ($keys as $key) {
            $setting = Setting::where('key', $key)->first();
            $branding[$key] = $setting?->value ?? '';
        }

        return Inertia::render('Admin/Settings/Branding', [
            'branding' => $branding,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $request->validate([
            'primary_color' => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color' => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color' => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'dark_bg_color' => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'social_instagram' => ['nullable', 'string', 'max:200'],
            'social_facebook' => ['nullable', 'string', 'max:200'],
            'social_youtube' => ['nullable', 'string', 'max:200'],
            'social_whatsapp' => ['nullable', 'string', 'max:20'],
            'social_linkedin' => ['nullable', 'string', 'max:200'],
            'footer_text' => ['nullable', 'string', 'max:500'],
            'logo' => ['nullable', 'image', 'max:2048'],
            'logo_dark' => ['nullable', 'image', 'max:2048'],
            'favicon' => ['nullable', 'image', 'max:512'],
        ]);

        $textFields = [
            'primary_color', 'secondary_color', 'accent_color', 'dark_bg_color',
            'social_instagram', 'social_facebook', 'social_youtube', 'social_whatsapp', 'social_linkedin',
            'footer_text',
        ];

        foreach ($textFields as $field) {
            if ($request->has($field)) {
                $this->saveSetting($field, $request->string($field)->value());
            }
        }

        // Upload de arquivos
        foreach (['logo' => 'logo_url', 'logo_dark' => 'logo_dark_url', 'favicon' => 'favicon_url'] as $fileField => $settingKey) {
            if ($request->hasFile($fileField)) {
                $existing = Setting::where('key', $settingKey)->first();
                if ($existing?->value) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $existing->value));
                }

                $path = $request->file($fileField)->store('branding', 'public');
                $url = '/storage/'.$path;

                $this->saveSetting($settingKey, $url);
            }
        }

        $this->settings->clearCache();

        return back()->with('success', 'Identidade visual atualizada com sucesso!');
    }

    private function saveSetting(string $key, string $value): void
    {
        $existing = Setting::where('key', $key)->first();

        if ($existing) {
            $existing->update(['value' => $value]);

            return;
        }

        $meta = self::FIELD_META[$key] ?? ['label' => $key, 'group' => 'branding'];

        Setting::create([
            'key' => $key,
            'value' => $value,
            'group' => $meta['group'],
            'type' => 'string',
            'label' => $meta['label'],
            'description' => null,
        ]);
    }
}
