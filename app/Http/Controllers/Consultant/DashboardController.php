<?php

declare(strict_types=1);

namespace App\Http\Controllers\Consultant;

use App\Domains\Orders\Models\Proposal;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __invoke(): Response
    {
        /** @var \App\Models\User $user */
        $user    = Auth::user();
        $profile = $user->consultantProfile;

        $thisMonth  = now()->startOfMonth();
        $lastMonth  = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();

        // Métricas do mês atual
        $myProposals = Proposal::where('user_id', $user->id);

        $draftCount    = (clone $myProposals)->where('status', 'draft')->count();
        $sentCount     = (clone $myProposals)->whereIn('status', ['sent', 'viewed'])->count();
        $acceptedCount = (clone $myProposals)->where('status', 'accepted')->count();
        $totalCount    = (clone $myProposals)->count();

        $revenueThisMonth = (clone $myProposals)
            ->where('status', 'accepted')
            ->whereBetween('accepted_at', [$thisMonth, now()])
            ->sum('total_cents');

        $revenueLastMonth = (clone $myProposals)
            ->where('status', 'accepted')
            ->whereBetween('accepted_at', [$lastMonth, $lastMonthEnd])
            ->sum('total_cents');

        $conversionRate = $totalCount > 0
            ? round($acceptedCount / $totalCount * 100, 1)
            : 0;

        // Últimas propostas
        $recentProposals = Proposal::where('user_id', $user->id)
            ->latest()
            ->limit(8)
            ->get()
            ->map(fn (Proposal $p) => [
                'uuid'          => $p->uuid,
                'reference'     => $p->reference,
                'title'         => $p->title,
                'customer_name' => $p->customer_name,
                'customer_city' => $p->customer_city,
                'status'        => $p->status,
                'status_label'  => $p->statusLabel(),
                'status_color'  => $p->statusColor(),
                'total_cents'   => $p->total_cents,
                'valid_until'   => $p->valid_until?->format('d/m/Y'),
                'created_at'    => $p->created_at->diffForHumans(),
            ]);

        // Meta mensal
        $monthlyGoal    = $profile?->monthly_goal_cents ?? 0;
        $goalProgress   = $monthlyGoal > 0
            ? min(100, round($revenueThisMonth / $monthlyGoal * 100, 1))
            : 0;

        return Inertia::render('Consultant/Dashboard', [
            'consultant' => [
                'name'            => $user->name,
                'email'           => $user->email,
                'region'          => $profile?->region,
                'commission_pct'  => $profile?->commission_pct ?? 5,
                'price_list'      => $user->effectivePriceList()?->name ?? 'Público',
            ],
            'stats' => [
                'draft'              => $draftCount,
                'sent'               => $sentCount,
                'accepted'           => $acceptedCount,
                'total'              => $totalCount,
                'conversion_rate'    => $conversionRate,
                'revenue_this_month' => $revenueThisMonth,
                'revenue_last_month' => $revenueLastMonth,
                'monthly_goal'       => $monthlyGoal,
                'goal_progress'      => $goalProgress,
                'commission_earned'  => (int) round($revenueThisMonth * (($profile?->commission_pct ?? 5) / 100)),
            ],
            'recent_proposals' => $recentProposals,
        ]);
    }
}
