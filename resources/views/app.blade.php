<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        {{-- Inertia controla o title via Head --}}
        <title inertia>{{ config('app.name', 'SolarHub Commerce') }}</title>

        {{-- SEO defaults (sobrescritos por cada página via Inertia Head) --}}
        <meta name="description" content="A maior plataforma de e-commerce de energia solar do Brasil. Painéis solares, inversores, kits fotovoltaicos e muito mais.">
        <meta name="robots" content="index, follow">
        <meta property="og:type" content="website">
        <meta property="og:site_name" content="{{ config('app.name') }}">
        <meta property="og:locale" content="pt_BR">

        {{-- Favicon (configurável via Admin > Identidade Visual) --}}
        @php($faviconUrl = app(\App\Domains\Settings\Services\SettingsService::class)->get('favicon_url', ''))
        <link rel="icon" href="{{ $faviconUrl !== '' ? $faviconUrl : '/favicon.ico' }}">

        {{-- Performance hints --}}
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com">

        {{-- Inter font --}}
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

        {{-- Vite assets --}}
        @viteReactRefresh
        @vite(['resources/js/app.tsx'])
        @inertiaHead
    </head>
    <body class="antialiased">
        @inertia
    </body>
</html>
