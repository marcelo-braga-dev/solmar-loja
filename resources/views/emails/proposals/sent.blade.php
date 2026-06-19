<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta {{ $proposal->reference }}</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: linear-gradient(135deg, #0B5FFF 0%, #003BB5 100%); padding: 40px; text-align: center;">
                <h1 style="color: #FFB300; margin: 0; font-size: 26px; font-weight: 900;">☀️ {{ $storeName }}</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Proposta comercial {{ $proposal->reference }}</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Olá, {{ $proposal->customer_name }}!</h2>
                <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">
                    Preparamos uma proposta comercial especial para você: <strong>{{ $proposal->title }}</strong>.
                    @if ($proposal->valid_until)
                        Esta proposta é válida até <strong>{{ $proposal->valid_until->format('d/m/Y') }}</strong>.
                    @endif
                </p>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
                    @foreach ($proposal->items as $item)
                        <tr>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px;">
                                {{ $item->quantity }}x {{ $item->description }}
                            </td>
                            <td style="padding: 8px 0; border-bottom: 1px solid #eee; color: #333; font-size: 14px; text-align: right;">
                                R$ {{ number_format($item->total_cents / 100, 2, ',', '.') }}
                            </td>
                        </tr>
                    @endforeach
                    <tr>
                        <td style="padding: 12px 0 0; color: #1a1a2e; font-size: 16px; font-weight: 700;">Total</td>
                        <td style="padding: 12px 0 0; color: #1a1a2e; font-size: 16px; font-weight: 700; text-align: right;">
                            R$ {{ number_format($proposal->total_cents / 100, 2, ',', '.') }}
                        </td>
                    </tr>
                </table>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="{{ $viewUrl }}"
                       style="background: #0B5FFF; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">
                        Ver proposta completa
                    </a>
                </div>

                <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
                    Na página da proposta você pode revisar todos os detalhes e aceitar ou recusar com um clique.
                </p>
            </td>
        </tr>
        <tr>
            <td style="background: #f8f9fa; padding: 24px; text-align: center;">
                <p style="color: #aaa; font-size: 12px; margin: 0;">
                    © {{ date('Y') }} {{ $storeName }}. Todos os direitos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
