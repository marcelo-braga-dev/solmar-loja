<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Domains\Settings\Models\Setting;
use Illuminate\Database\Seeder;

final class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Dados da empresa
            ['group' => 'general', 'key' => 'store_name', 'value' => 'SolarHub Commerce', 'type' => 'string', 'label' => 'Nome da loja'],
            ['group' => 'general', 'key' => 'store_tagline', 'value' => '', 'type' => 'string', 'label' => 'Slogan / tagline'],
            ['group' => 'general', 'key' => 'store_description', 'value' => '', 'type' => 'string', 'label' => 'Descrição da loja', 'description' => 'Aparece no rodapé e nas meta descriptions padrão.'],
            ['group' => 'general', 'key' => 'store_email', 'value' => 'contato@solarhub.com.br', 'type' => 'string', 'label' => 'E-mail da loja'],
            ['group' => 'general', 'key' => 'store_phone', 'value' => '(11) 4002-8922', 'type' => 'string', 'label' => 'Telefone'],
            ['group' => 'general', 'key' => 'store_cnpj', 'value' => '', 'type' => 'string', 'label' => 'CNPJ'],
            ['group' => 'general', 'key' => 'store_address', 'value' => '', 'type' => 'string', 'label' => 'Endereço'],
            ['group' => 'general', 'key' => 'maintenance_mode', 'value' => 'false', 'type' => 'boolean', 'label' => 'Modo manutenção'],

            // Pagamentos
            ['group' => 'payment', 'key' => 'pix_enabled', 'value' => 'true', 'type' => 'boolean', 'label' => 'Pix habilitado'],
            ['group' => 'payment', 'key' => 'boleto_enabled', 'value' => 'true', 'type' => 'boolean', 'label' => 'Boleto habilitado'],
            ['group' => 'payment', 'key' => 'credit_card_enabled', 'value' => 'true', 'type' => 'boolean', 'label' => 'Cartão de crédito habilitado'],
            ['group' => 'payment', 'key' => 'max_installments', 'value' => '12', 'type' => 'integer', 'label' => 'Máximo de parcelas'],
            ['group' => 'payment', 'key' => 'pix_discount_percent', 'value' => '5', 'type' => 'integer', 'label' => 'Desconto no Pix (%)'],

            // Frete
            ['group' => 'shipping', 'key' => 'free_shipping_min_cents', 'value' => '200000', 'type' => 'integer', 'label' => 'Valor mínimo para frete grátis (centavos)'],
            ['group' => 'shipping', 'key' => 'free_shipping_enabled', 'value' => 'true', 'type' => 'boolean', 'label' => 'Frete grátis habilitado'],

            // SEO
            ['group' => 'seo', 'key' => 'meta_title', 'value' => 'SolarHub Commerce — Energia Solar no Brasil', 'type' => 'string', 'label' => 'Meta title padrão'],
            ['group' => 'seo', 'key' => 'meta_description', 'value' => 'A maior plataforma de e-commerce de energia solar do Brasil.', 'type' => 'string', 'label' => 'Meta description padrão'],
            ['group' => 'seo', 'key' => 'google_analytics_id', 'value' => '', 'type' => 'string', 'label' => 'Google Analytics ID'],

            // Login social — Google OAuth
            ['group' => 'social_login', 'key' => 'google_oauth_enabled', 'value' => 'false', 'type' => 'boolean', 'label' => 'Login com Google habilitado', 'description' => 'Exibe o botão "Continuar com Google" na página de login e permite a autenticação via OAuth.'],
            ['group' => 'social_login', 'key' => 'google_client_id', 'value' => '', 'type' => 'string', 'label' => 'Google Client ID', 'description' => 'ID do cliente OAuth gerado no Google Cloud Console.'],
            ['group' => 'social_login', 'key' => 'google_client_secret', 'value' => '', 'type' => 'password', 'label' => 'Google Client Secret', 'description' => 'Chave secreta do cliente OAuth. Não é exibida após salva.'],
            ['group' => 'social_login', 'key' => 'google_redirect_url', 'value' => rtrim((string) config('app.url'), '/').'/auth/google/callback', 'type' => 'string', 'label' => 'URL de callback (Redirect URI)', 'description' => 'Cole exatamente esta URL em "URIs de redirecionamento autorizados" no Google Cloud Console.'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                $setting + ['description' => null]
            );
        }
    }
}
