<?php

return [

    'ssr' => [
        'enabled' => (bool) env('INERTIA_SSR_ENABLED', false),
        'url' => env('INERTIA_SSR_URL', 'http://127.0.0.1:13714'),
        'runtime' => env('INERTIA_SSR_RUNTIME', 'node'),
        'bundle' => env('INERTIA_SSR_BUNDLE'),
        'throw_on_error' => (bool) env('INERTIA_SSR_THROW_ON_ERROR', false),
    ],

    'testing' => [
        // Desabilitado: os componentes existem mas o PHP não encontra .tsx no container
        'ensure_pages_exist' => false,
    ],

    'expose_shared_prop_keys' => true,

];
