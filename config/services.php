<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // Gateway de pagamento ativo
    'payment' => [
        'gateway' => env('PAYMENT_GATEWAY', 'mock'),
    ],

    // Asaas (https://www.asaas.com/)
    'asaas' => [
        'api_key'     => env('ASAAS_API_KEY'),
        'environment' => env('ASAAS_ENVIRONMENT', 'sandbox'),
    ],

    // ERP / Distribuidor
    'erp' => [
        'base_url' => env('ERP_BASE_URL'),
        'api_key'  => env('ERP_API_KEY'),
        'timeout'  => env('ERP_TIMEOUT', 30),
        'enabled'  => env('ERP_SYNC_ENABLED', false),
    ],

];
