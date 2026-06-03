<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Domains\Settings\Models\Setting;
use App\Domains\Settings\Services\SettingsService;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class SettingsController extends Controller
{
    public function __construct(
        private readonly SettingsService $settings,
    ) {}

    public function index(): Response
    {
        $grouped = Setting::all()->groupBy('group')->map(fn ($group) => $group->map(fn (Setting $s) => [
            'id'          => $s->id,
            'key'         => $s->key,
            'value'       => $s->value,
            'type'        => $s->type,
            'label'       => $s->label,
            'description' => $s->description,
        ]));

        return Inertia::render('Admin/Settings/Index', [
            'groups' => $grouped,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'settings'         => ['required', 'array'],
            'settings.*.key'   => ['required', 'string'],
            'settings.*.value' => ['nullable', 'string'],
        ]);

        foreach ($data['settings'] as $item) {
            Setting::where('key', $item['key'])->update(['value' => $item['value'] ?? '']);
        }

        $this->settings->clearCache();

        return back()->with('success', 'Configurações salvas com sucesso.');
    }
}
