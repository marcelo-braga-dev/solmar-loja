<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\BlogController;
use App\Http\Controllers\Admin\BrandingController;
use App\Http\Controllers\Admin\PostCategoryController;
use App\Http\Controllers\Admin\BrandController;
use App\Http\Controllers\Admin\NotificationController;
use App\Http\Controllers\Admin\CouponController;
use App\Http\Controllers\Admin\DashboardController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\ReviewAdminController;
use App\Http\Controllers\Admin\SettingsController;
use App\Http\Controllers\Admin\CategoryController;
use App\Http\Controllers\Admin\ProductController;
use App\Http\Controllers\Admin\ProductImageController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Auth\TwoFactorController;
use App\Http\Controllers\Admin\CustomerAdminController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\OrderAdminController;
use App\Http\Controllers\Storefront\AccountController;
use App\Http\Controllers\Storefront\CartController;
use App\Http\Controllers\Storefront\CategoryController as StorefrontCategoryController;
use App\Http\Controllers\Storefront\CheckoutController;
use App\Http\Controllers\Storefront\HomeController;
use App\Http\Controllers\Storefront\BlogController as StorefrontBlogController;
use App\Http\Controllers\Admin\NewsletterAdminController;
use App\Http\Controllers\Storefront\NewsletterController;
use App\Http\Controllers\Storefront\StaticPageController;
use App\Http\Controllers\Storefront\PaymentController;
use App\Http\Controllers\Storefront\ProductController as StorefrontProductController;
use App\Http\Controllers\Storefront\ReviewController;
use App\Http\Controllers\Storefront\SimulatorController;
use App\Http\Controllers\Storefront\SearchController;
use App\Http\Controllers\Storefront\WebhookController;
use App\Http\Controllers\SitemapController;
use Illuminate\Support\Facades\Route;

// ─── Storefront público ───────────────────────────────────────────────────────

Route::get('/', HomeController::class)->name('home');
Route::get('/sitemap.xml', SitemapController::class)->name('sitemap');

Route::get('/produtos/{slug}', [StorefrontProductController::class, 'show'])->name('products.show');
Route::get('/categorias/{slug}', [StorefrontCategoryController::class, 'show'])->name('categories.show');
Route::get('/busca', [SearchController::class, 'results'])->name('search');
Route::get('/api/search/autocomplete', [SearchController::class, 'autocomplete'])
    ->middleware('throttle:60,1')
    ->name('search.autocomplete');

// Blog
Route::get('/blog', [StorefrontBlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [StorefrontBlogController::class, 'show'])->name('blog.show');

// Páginas institucionais
Route::get('/sobre', [StaticPageController::class, 'sobre'])->name('about');
Route::get('/contato', [StaticPageController::class, 'contato'])->name('contact');
Route::post('/contato', [StaticPageController::class, 'contatoStore'])->name('contact.store');
Route::get('/privacidade', [StaticPageController::class, 'privacidade'])->name('privacy');

// Reviews e Q&A
Route::post('/produtos/{product}/reviews', [ReviewController::class, 'store'])->middleware('auth')->name('reviews.store');
Route::post('/produtos/{product}/questions', [ReviewController::class, 'storeQuestion'])->middleware('auth')->name('questions.store');
Route::get('/api/products/{product}/reviews', [ReviewController::class, 'productReviews'])->name('reviews.list');

// Simulador fotovoltaico
Route::get('/simulador', [SimulatorController::class, 'index'])->name('simulator');
Route::post('/api/simulator/calculate', [SimulatorController::class, 'calculate'])
    ->middleware('throttle:30,1')
    ->name('simulator.calculate');

// Newsletter
Route::post('/newsletter/subscribe', [NewsletterController::class, 'subscribe'])->name('newsletter.subscribe');
Route::get('/newsletter/confirmar/{token}', [NewsletterController::class, 'confirm'])->name('newsletter.confirm');
Route::get('/newsletter/cancelar/{token}', [NewsletterController::class, 'unsubscribe'])->name('newsletter.unsubscribe');

// ─── Auth ─────────────────────────────────────────────────────────────────────

Route::middleware('guest')->group(function (): void {
    Route::get('/register', [RegisterController::class, 'create'])->name('register');
    Route::post('/register', [RegisterController::class, 'store']);

    Route::get('/login', [LoginController::class, 'create'])->name('login');
    Route::post('/login', [LoginController::class, 'store']);

    Route::get('/esqueci-minha-senha', [PasswordResetController::class, 'requestForm'])->name('password.request');
    Route::post('/esqueci-minha-senha', [PasswordResetController::class, 'sendLink'])->name('password.email');

    Route::get('/redefinir-senha/{token}', [PasswordResetController::class, 'resetForm'])->name('password.reset');
    Route::post('/redefinir-senha', [PasswordResetController::class, 'reset'])->name('password.update');
});

Route::middleware('auth')->group(function (): void {
    Route::post('/logout', [LoginController::class, 'destroy'])->name('logout');

    // Verificação de e-mail
    Route::get('/verify-email', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::get('/verify-email/{id}/{hash}', [EmailVerificationController::class, 'verify'])
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');
    Route::post('/verify-email/resend', [EmailVerificationController::class, 'resend'])
        ->middleware('throttle:6,1')
        ->name('verification.resend');

    // 2FA — challenge (para admins que têm 2FA habilitado)
    Route::get('/two-factor/challenge', [TwoFactorController::class, 'challenge'])->name('two-factor.challenge');
    Route::post('/two-factor/challenge', [TwoFactorController::class, 'verify'])->name('two-factor.verify');

    // 2FA — setup (apenas admin, sem exigir 2FA pois pode estar configurando pela primeira vez)
    Route::middleware('admin')->group(function (): void {
        Route::get('/two-factor/setup', [TwoFactorController::class, 'setup'])->name('two-factor.setup');
        Route::post('/two-factor/enable', [TwoFactorController::class, 'enable'])->name('two-factor.enable');
        Route::post('/two-factor/disable', [TwoFactorController::class, 'disable'])->name('two-factor.disable');
    });
});

// ─── Carrinho ─────────────────────────────────────────────────────────────────

Route::get('/carrinho', [CartController::class, 'show'])->name('cart.show');
Route::post('/carrinho/items', [CartController::class, 'store'])->name('cart.store');
Route::patch('/carrinho/items/{item}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/carrinho/items/{item}', [CartController::class, 'destroy'])->name('cart.destroy');
Route::get('/carrinho/count', [CartController::class, 'count'])->name('cart.count');
Route::post('/carrinho/coupon', [CartController::class, 'applyCoupon'])->name('cart.coupon.apply');
Route::delete('/carrinho/coupon', [CartController::class, 'removeCoupon'])->name('cart.coupon.remove');

// ─── Checkout e Pagamento ─────────────────────────────────────────────────────

Route::middleware('auth')->group(function (): void {
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout.index');
    Route::post('/checkout', [CheckoutController::class, 'store'])->name('checkout.store');

    Route::get('/pedidos/{order:uuid}/pagamento', [PaymentController::class, 'show'])->name('payment.show');
    Route::post('/pedidos/{order:uuid}/pagamento', [PaymentController::class, 'store'])->name('payment.store');
});

// ─── Webhooks (sem auth, validados por assinatura) ────────────────────────────

Route::post('/webhooks/{gateway}', [WebhookController::class, 'handle'])
    ->name('webhooks.handle')
    ->withoutMiddleware(['web']);

// ─── Área do cliente ──────────────────────────────────────────────────────────

Route::middleware(['auth', 'verified'])->prefix('conta')->name('account.')->group(function (): void {
    Route::get('/', [AccountController::class, 'dashboard'])->name('dashboard');
    Route::get('/perfil', [AccountController::class, 'profileEdit'])->name('profile');
    Route::put('/perfil', [AccountController::class, 'profileUpdate'])->name('profile.update');
    Route::put('/senha', [AccountController::class, 'passwordUpdate'])->name('password.update');

    Route::get('/enderecos', [AccountController::class, 'addresses'])->name('addresses');
    Route::post('/enderecos', [AccountController::class, 'storeAddress'])->name('addresses.store');
    Route::delete('/enderecos/{address}', [AccountController::class, 'destroyAddress'])->name('addresses.destroy');

    Route::get('/seguranca', [AccountController::class, 'security'])->name('security');

    Route::get('/favoritos', [AccountController::class, 'favorites'])->name('favorites');
    Route::post('/favoritos/toggle', [AccountController::class, 'toggleFavorite'])->name('favorites.toggle');

    Route::get('/pedidos', [AccountController::class, 'orders'])->name('orders.index');
    Route::get('/pedidos/{order:uuid}', [AccountController::class, 'orderShow'])->name('orders.show');
});

// ─── Admin ────────────────────────────────────────────────────────────────────

Route::middleware(['auth', 'admin', 'two-factor'])->prefix('admin')->name('admin.')->group(function (): void {

    Route::get('/', DashboardController::class)->name('dashboard');

    // Produtos
    Route::get('products', [ProductController::class, 'index'])->name('products.index');
    Route::get('products/create', [ProductController::class, 'create'])->name('products.create');
    Route::post('products', [ProductController::class, 'store'])->name('products.store');
    Route::get('products/{product:uuid}/edit', [ProductController::class, 'edit'])->name('products.edit');
    Route::put('products/{product:uuid}', [ProductController::class, 'update'])->name('products.update');
    Route::delete('products/{product:uuid}', [ProductController::class, 'destroy'])->name('products.destroy');
    Route::post('products/{product:uuid}/publish', [ProductController::class, 'publish'])->name('products.publish');
    Route::post('products/{product:uuid}/unpublish', [ProductController::class, 'unpublish'])->name('products.unpublish');

    // Imagens de produto
    Route::post('products/{product}/images', [ProductImageController::class, 'store'])->name('products.images.store');
    Route::delete('products/{product}/images/{image}', [ProductImageController::class, 'destroy'])->name('products.images.destroy');
    Route::post('products/{product}/images/reorder', [ProductImageController::class, 'reorder'])->name('products.images.reorder');

    // Categorias
    Route::get('categories', [CategoryController::class, 'index'])->name('categories.index');
    Route::post('categories', [CategoryController::class, 'store'])->name('categories.store');
    Route::put('categories/{category}', [CategoryController::class, 'update'])->name('categories.update');
    Route::delete('categories/{category}', [CategoryController::class, 'destroy'])->name('categories.destroy');

    // Marcas
    Route::get('brands', [BrandController::class, 'index'])->name('brands.index');
    Route::post('brands', [BrandController::class, 'store'])->name('brands.store');
    Route::put('brands/{brand}', [BrandController::class, 'update'])->name('brands.update');
    Route::delete('brands/{brand}', [BrandController::class, 'destroy'])->name('brands.destroy');

    // Pedidos
    Route::get('orders', [OrderAdminController::class, 'index'])->name('orders.index');
    Route::get('orders/{order:uuid}', [OrderAdminController::class, 'show'])->name('orders.show');
    Route::patch('orders/{order:uuid}/status', [OrderAdminController::class, 'updateStatus'])->name('orders.status');
    Route::post('orders/{order:uuid}/shipment', [OrderAdminController::class, 'addShipment'])->name('orders.shipment');

    // Clientes
    Route::get('customers', [CustomerAdminController::class, 'index'])->name('customers.index');
    Route::get('customers/{user}', [CustomerAdminController::class, 'show'])->name('customers.show');

    // Estoque
    Route::get('inventory', [InventoryController::class, 'index'])->name('inventory.index');
    Route::post('inventory/adjust', [InventoryController::class, 'adjust'])->name('inventory.adjust');

    // Cupons
    Route::get('coupons', [CouponController::class, 'index'])->name('coupons.index');
    Route::post('coupons', [CouponController::class, 'store'])->name('coupons.store');
    Route::patch('coupons/{coupon}/toggle', [CouponController::class, 'toggle'])->name('coupons.toggle');
    Route::delete('coupons/{coupon}', [CouponController::class, 'destroy'])->name('coupons.destroy');

    // Reviews (moderação)
    Route::get('reviews', [ReviewAdminController::class, 'index'])->name('reviews.index');
    Route::patch('reviews/{review}/approve', [ReviewAdminController::class, 'approve'])->name('reviews.approve');
    Route::patch('reviews/{review}/reject', [ReviewAdminController::class, 'reject'])->name('reviews.reject');
    Route::post('questions/{question}/answer', [ReviewAdminController::class, 'answerQuestion'])->name('questions.answer');

    // Blog posts
    Route::get('posts', [BlogController::class, 'index'])->name('posts.index');
    Route::get('posts/create', [BlogController::class, 'create'])->name('posts.create');
    Route::post('posts', [BlogController::class, 'store'])->name('posts.store');
    Route::get('posts/{post}/edit', [BlogController::class, 'edit'])->name('posts.edit');
    Route::put('posts/{post}', [BlogController::class, 'update'])->name('posts.update');
    Route::delete('posts/{post}', [BlogController::class, 'destroy'])->name('posts.destroy');

    // Blog categorias
    Route::get('post-categories', [PostCategoryController::class, 'index'])->name('post-categories.index');
    Route::post('post-categories', [PostCategoryController::class, 'store'])->name('post-categories.store');
    Route::put('post-categories/{postCategory}', [PostCategoryController::class, 'update'])->name('post-categories.update');
    Route::delete('post-categories/{postCategory}', [PostCategoryController::class, 'destroy'])->name('post-categories.destroy');

    // Relatórios
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('reports/dre', [ReportController::class, 'dre'])->name('reports.dre');
    Route::post('reports/export', [ReportController::class, 'exportCsv'])->name('reports.export');
    Route::get('reports/download', [ReportController::class, 'downloadExport'])->name('reports.download');

    // Configurações
    Route::get('settings', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('settings', [SettingsController::class, 'update'])->name('settings.update');

    // Identidade visual
    Route::get('branding', [BrandingController::class, 'index'])->name('branding.index');
    Route::post('branding', [BrandingController::class, 'update'])->name('branding.update');

    // Notificações
    Route::get('notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markRead'])->name('notifications.read');
    Route::post('notifications/read-all', [NotificationController::class, 'markAllRead'])->name('notifications.read-all');

    // Newsletter
    Route::get('newsletter', [NewsletterAdminController::class, 'index'])->name('newsletter.index');
    Route::delete('newsletter/{subscriber}', [NewsletterAdminController::class, 'destroy'])->name('newsletter.destroy');
    Route::get('newsletter/export', [NewsletterAdminController::class, 'exportCsv'])->name('newsletter.export');
});
