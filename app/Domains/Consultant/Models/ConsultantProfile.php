<?php

declare(strict_types=1);

namespace App\Domains\Consultant\Models;

use App\Domains\Catalog\Models\PriceList;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class ConsultantProfile extends Model
{
    protected $fillable = [
        'user_id', 'phone', 'region', 'commission_pct', 'price_list_id',
        'monthly_goal_cents', 'proposal_goal',
        'total_revenue_cents', 'total_proposals', 'accepted_proposals',
        'bio',
    ];

    protected $casts = [
        'commission_pct'       => 'float',
        'monthly_goal_cents'   => 'integer',
        'proposal_goal'        => 'integer',
        'total_revenue_cents'  => 'integer',
        'total_proposals'      => 'integer',
        'accepted_proposals'   => 'integer',
    ];

    public function user(): BelongsTo      { return $this->belongsTo(User::class); }
    public function priceList(): BelongsTo { return $this->belongsTo(PriceList::class); }

    public function conversionRate(): float
    {
        if ($this->total_proposals === 0) return 0.0;

        return round($this->accepted_proposals / $this->total_proposals * 100, 1);
    }

    public function monthlyGoalProgress(int $currentMonthRevenue): float
    {
        if ($this->monthly_goal_cents === 0) return 0.0;

        return min(100, round($currentMonthRevenue / $this->monthly_goal_cents * 100, 1));
    }
}
