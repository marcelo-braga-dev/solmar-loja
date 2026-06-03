<?php

declare(strict_types=1);

namespace App\Providers;

use App\Domains\Catalog\Events\ProductPublished;
use App\Domains\Catalog\Events\ProductUpdated;
use App\Domains\Inventory\Events\StockChanged;
use App\Domains\Orders\Events\OrderPlaced;
use App\Domains\Payments\Events\PaymentApproved;
use App\Domains\Payments\Events\PaymentFailed;
use App\Domains\Payments\Listeners\CreateTransactionOnPaymentApproved;
use App\Domains\Payments\Listeners\ReleaseStockOnPaymentApproved;
use App\Listeners\NotifyAdminsOnLowStock;
use App\Listeners\NotifyAdminsOnNewOrder;
use App\Listeners\NotifyAdminsOnPaymentFailed;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

class EventServiceProvider extends ServiceProvider
{
    /** @var array<class-string, list<class-string>> */
    protected $listen = [
        PaymentApproved::class => [
            ReleaseStockOnPaymentApproved::class,
            CreateTransactionOnPaymentApproved::class,
        ],
        PaymentFailed::class => [
            NotifyAdminsOnPaymentFailed::class,
        ],
        OrderPlaced::class => [
            NotifyAdminsOnNewOrder::class,
        ],
        StockChanged::class => [
            NotifyAdminsOnLowStock::class,
        ],
        ProductPublished::class => [],
        ProductUpdated::class   => [],
    ];

    public function boot(): void {}

    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
