<?php

declare(strict_types=1);

namespace App\Domains\Marketing\Services;

use App\Domains\Marketing\Models\LoyaltyBalance;
use App\Domains\Marketing\Models\LoyaltyTransaction;
use App\Domains\Orders\Models\Order;
use App\Models\User;
use Illuminate\Support\Facades\DB;

final class LoyaltyService
{
    /** 1% do valor do pedido em pontos (1 ponto = R$ 0,01) */
    private const EARN_RATE = 0.01;

    public function getOrCreateBalance(User $user): LoyaltyBalance
    {
        return LoyaltyBalance::firstOrCreate(
            ['user_id' => $user->id],
            ['points' => 0, 'lifetime_points' => 0]
        );
    }

    public function getBalance(User $user): int
    {
        return LoyaltyBalance::where('user_id', $user->id)->value('points') ?? 0;
    }

    /** Concede pontos pela compra de um pedido (chamado após pagamento confirmado). */
    public function earnFromOrder(Order $order): LoyaltyTransaction
    {
        if ($order->user_id === null) {
            throw new \DomainException('Pedido sem usuário autenticado.');
        }

        $points = (int) floor($order->total_cents * self::EARN_RATE);
        if ($points <= 0) {
            throw new \DomainException('Valor insuficiente para gerar pontos.');
        }

        return DB::transaction(function () use ($order, $points): LoyaltyTransaction {
            $balance = $this->getOrCreateBalance($order->user);
            $newBalance = $balance->points + $points;

            $balance->update([
                'points'          => $newBalance,
                'lifetime_points' => $balance->lifetime_points + $points,
            ]);

            return LoyaltyTransaction::create([
                'user_id'      => $order->user_id,
                'type'         => 'earn',
                'points'       => $points,
                'balance_after'=> $newBalance,
                'description'  => "Pedido #{$order->uuid}",
                'source_type'  => Order::class,
                'source_id'    => $order->id,
                'expires_at'   => now()->addYear(),
            ]);
        });
    }

    /** Resgata pontos como desconto em centavos (1 ponto = R$ 0,01). */
    public function redeem(User $user, int $points, string $description): LoyaltyTransaction
    {
        return DB::transaction(function () use ($user, $points, $description): LoyaltyTransaction {
            $balance = $this->getOrCreateBalance($user);

            if ($balance->points < $points) {
                throw new \DomainException("Saldo insuficiente. Disponível: {$balance->points} pontos.");
            }

            $newBalance = $balance->points - $points;
            $balance->update(['points' => $newBalance]);

            return LoyaltyTransaction::create([
                'user_id'      => $user->id,
                'type'         => 'redeem',
                'points'       => -$points,
                'balance_after'=> $newBalance,
                'description'  => $description,
            ]);
        });
    }

    /** Formata pontos para exibição: 500 pts → "R$ 5,00 em créditos" */
    public function formatBalance(int $points): string
    {
        $reais = number_format($points / 100, 2, ',', '.');

        return "R$ {$reais} em créditos ({$points} pontos)";
    }

    /** Calcula pontos que serão ganhos em uma compra. */
    public function previewEarnings(int $totalCents): int
    {
        return (int) floor($totalCents * self::EARN_RATE);
    }
}
