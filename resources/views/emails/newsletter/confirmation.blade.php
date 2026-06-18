<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Confirme sua inscrição</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
    <table style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <tr>
            <td style="background: linear-gradient(135deg, #0B5FFF 0%, #003BB5 100%); padding: 40px; text-align: center;">
                <h1 style="color: #FFB300; margin: 0; font-size: 28px; font-weight: 900;">☀️ {{ $storeName }}</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 8px 0 0; font-size: 14px;">Newsletter sobre energia solar</p>
            </td>
        </tr>
        <tr>
            <td style="padding: 40px;">
                <h2 style="color: #1a1a2e; margin: 0 0 16px; font-size: 22px;">Olá, {{ $subscriberName }}!</h2>
                <p style="color: #555; line-height: 1.6; margin: 0 0 24px;">
                    Obrigado por se inscrever na newsletter <strong>{{ $storeName }}</strong>! Para confirmar sua inscrição e começar a receber nossas dicas e novidades sobre energia solar, clique no botão abaixo:
                </p>

                <div style="text-align: center; margin: 32px 0;">
                    <a href="{{ $confirmUrl }}"
                       style="background: #0B5FFF; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block;">
                        Confirmar inscrição
                    </a>
                </div>

                <p style="color: #888; font-size: 13px; line-height: 1.6; margin: 24px 0 0;">
                    Se você não solicitou esta inscrição, ignore este e-mail. O link expira em 7 dias.<br><br>
                    Caso queira cancelar a inscrição: <a href="{{ $unsubscribeUrl }}" style="color: #0B5FFF;">cancelar inscrição</a>
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
