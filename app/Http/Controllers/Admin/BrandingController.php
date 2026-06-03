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
    public function __construct(private readonly SettingsService $settings) {}

    public function index(): Response
    {
        $keys = [
            'store_name', 'store_tagline', 'store_description',
            'logo_url', 'logo_dark_url', 'favicon_url',
            'primary_color', 'secondary_color', 'accent_color', 'dark_bg_color',
            'social_instagram', 'social_facebook', 'social_youtube', 'social_whatsapp', 'social_linkedin',
            'footer_text', 'store_cnpj',
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
            'store_name'       => ['required', 'string', 'max:100'],
            'store_tagline'    => ['nullable', 'string', 'max:200'],
            'store_description' => ['nullable', 'string', 'max:500'],
            'primary_color'    => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'secondary_color'  => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'accent_color'     => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'dark_bg_color'    => ['nullable', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'social_instagram' => ['nullable', 'string', 'max:200'],
            'social_facebook'  => ['nullable', 'string', 'max:200'],
            'social_youtube'   => ['nullable', 'string', 'max:200'],
            'social_whatsapp'  => ['nullable', 'string', 'max:20'],
            'social_linkedin'  => ['nullable', 'string', 'max:200'],
            'footer_text'      => ['nullable', 'string', 'max:500'],
            'store_cnpj'       => ['nullable', 'string', 'max:18'],
            'logo'             => ['nullable', 'image', 'max:2048'],
            'logo_dark'        => ['nullable', 'image', 'max:2048'],
            'favicon'          => ['nullable', 'image', 'max:512'],
        ]);

        $textFields = [
            'store_name', 'store_tagline', 'store_description',
            'primary_color', 'secondary_color', 'accent_color', 'dark_bg_color',
            'social_instagram', 'social_facebook', 'social_youtube', 'social_whatsapp', 'social_linkedin',
            'footer_text', 'store_cnpj',
        ];

        foreach ($textFields as $field) {
            if ($request->has($field)) {
                Setting::updateOrCreate(
                    ['key' => $field],
                    [
                        'value'       => $request->string($field)->value(),
                        'group'       => $this->groupFor($field),
                        'type'        => 'string',
                        'label'       => $field,
                        'description' => null,
                    ]
                );
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
                $url  = '/storage/' . $path;

                Setting::updateOrCreate(
                    ['key' => $settingKey],
                    ['value' => $url, 'group' => 'branding', 'type' => 'string', 'label' => $settingKey, 'description' => null]
                );
            }
        }

        $this->settings->clearCache();

        return back()->with('success', 'Identidade visual atualizada com sucesso!');
    }

    private function groupFor(string $key): string
    {
        return match (true) {
            str_starts_with($key, 'social_') => 'social',
            str_starts_with($key, 'primary_color'),
            str_starts_with($key, 'secondary_color'),
            str_starts_with($key, 'accent_color'),
            str_starts_with($key, 'dark_bg_color') => 'branding',
            default                                  => 'general',
        };
    }
}
