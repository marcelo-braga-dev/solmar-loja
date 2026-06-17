<?php

declare(strict_types=1);

namespace App\Domains\Integrations\Exceptions;

/**
 * Token ausente, vazio ou inválido (HTTP 401). Não é resolvido tentando de novo —
 * é preciso corrigir APPSOLAR_API_TOKEN no .env.
 */
final class AppSolarAuthenticationException extends AppSolarApiException {}
