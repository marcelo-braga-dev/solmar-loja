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
use App\Http\Controllers\Admin\MenuItemController;
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
use App\Http\Controllers\Admin\BulkProductController;
use App\Http\Controllers\Admin\CompanyController;
use App\Http\Controllers\Admin\PriceListController;
use App\Http\Controllers\Consultant\DashboardController as ConsultantDashboard;
use App\Http\Controllers\Consultant\ProposalController as ConsultantProposalController;
use App\Http\Controllers\Storefront\B2bController;
use App\Http\Controllers\Admin\QuoteAdminController;
use App\Http\Controllers\Admin\ReturnAdminController;
use App\Http\Controllers\Admin\SupportTicketAdminController;
use App\Http\Controllers\Storefront\QuoteController;
use App\Http\Controllers\Storefront\ReturnController;
use App\Http\Controllers\Storefront\SocialiteController;
use App\Http\Controllers\Storefront\SupportTicketController;
use App\Http\Controllers\Admin\FlashSaleController as AdminFlashSaleController;
use App\Http\Controllers\Admin\IntegrationController;
use App\Http\Controllers\Admin\ProductImportController;
use App\Http\Controllers\Admin\NewsletterAdminController;
use App\Http\Controllers\Storefront\NewsletterController;
use App\Http\Controllers\Storefront\StaticPageController;
use App\Http\Controllers\Storefront\PaymentController;
use App\Http\Controllers\Storefront\ProductController as StorefrontProductController;
use App\Http\Controllers\Storefront\ReviewController;
use App\Http\Controllers\Storefront\SimulatorController;
use App\Http\Controllers\Storefront\SearchController;
use App\Http\Controllers\Storefront\CompareController;
use App\Http\Controllers\Storefront\KitBuilderController;
use App\Http\Controllers\Storefront\StockAlertController;
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
Route::get('/vagas', [StaticPageController::class, 'vagas'])->name('careers');
Route::get('/ajuda', [StaticPageController::class, 'ajuda'])->name('help');

// Reviews e Q&A
Route::post('/produtos/{product}/reviews', [ReviewController::class, 'store'])->middleware('auth')->name('reviews.store');
Route::post('/produtos/{product}/questions', [ReviewController::class, 'storeQuestion'])->middleware('auth')->name('questions.store');
Route::get('/api/products/{product}/reviews', [ReviewController::class, 'productReviews'])->name('reviews.list');

// Simulador fotovoltaico
Route::get('/simulador', [SimulatorController::class, 'index'])->name('simulator');
Route::post('/api/simulator/calculate', [SimulatorController::class, 'calculate'])
    ->middleware('throttle:30,1')
    ->name('simulator.calculate');

// ─── Painel do Consultor ─────────────────────────────────────────────────────

Route::middleware(['auth', 'verified', 'consultant'])->prefix('consultor')->name('consultor.')->group(function (): void {
    Route::get('/', ConsultantDashboard::class)->name('dashboard');

    // Propostas
    Route::get('/propostas', [ConsultantProposalController::class, 'index'])->name('proposals.index');
    Route::get('/propostas/criar', [ConsultantProposalController::class, 'create'])->name('proposals.create');
    Route::post('/propostas', [ConsultantProposalController::class, 'store'])->name('proposals.store');
    Route::get('/propostas/{uuid}', [ConsultantProposalController::class, 'show'])->name('proposals.show');
    Route::post('/propostas/{uuid}/enviar', [ConsultantProposalController::class, 'send'])->name('proposals.send');
    Route::delete('/propostas/{uuid}', [ConsultantProposalController::class, 'destroy'])->name('proposals.destroy');
});

// ─── Portal B2B (Integradoras / Distribuidoras) ───────────────────────────────

Route::get('/portal-b2b', [B2bController::class, 'landing'])->name('b2b.landing');

Route::middleware(['auth', 'verified'])->prefix('portal-b2b')->name('b2b.')->group(function (): void {
    Route::get('/cadastrar', [B2bController::class, 'register'])->name('register');
    Route::post('/cadastrar', [B2bController::class, 'store'])->name('store');
    Route::get('/dashboard', [B2bController::class, 'dashboard'])->name('dashboard');
    Route::get('/projetos', [B2bController::class, 'projects'])->name('projects');
    Route::post('/projetos', [B2bController::class, 'storeProject'])->name('projects.store');
});

// Cotação / Orçamento
Route::post('/cotacao', [QuoteController::class, 'store'])->name('quotes.store')->middleware('throttle:10,1');
Route::middleware(['auth', 'verified'])->get('/conta/cotacoes', [QuoteController::class, 'index'])->name('account.quotes');

// Login Social
Route::middleware('guest')->group(function (): void {
    Route::get('/auth/google', [SocialiteController::class, 'redirectToGoogle'])->name('auth.google');
    Route::get('/auth/google/callback', [SocialiteController::class, 'handleGoogleCallback'])->name('auth.google.callback');
});

// Flash Sale ativa (público — para verificar no frontend)
Route::get('/api/flash-sale/{product}', [AdminFlashSaleController::class, 'activeForProduct'])->name('flash-sale.product');

// Comparação de produtos
Route::get('/comparar', [CompareController::class, 'index'])->name('compare.index');

// Kit Builder
Route::get('/monte-seu-kit', [KitBuilderController::class, 'index'])->name('kit-builder.index');
Route::get('/api/kit-builder/inverters', [KitBuilderController::class, 'inverters'])->name('kit-builder.inverters');
Route::get('/api/kit-builder/accessories', [KitBuilderController::class, 'accessories'])->name('kit-builder.accessories');

// Alertas de Volta ao Estoque
Route::post('/produtos/{product}/alertas', [StockAlertController::class, 'subscribe'])->name('stock-alert.subscribe')->middleware('throttle:10,1');
Route::get('/alertas/cancelar/{token}', [StockAlertController::class, 'unsubscribe'])->name('stock-alert.unsubscribe');

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

    // Devoluções
    Route::get('/devolucoes', [ReturnController::class, 'index'])->name('returns.index');
    Route::get('/devolucoes/criar', [ReturnController::class, 'create'])->name('returns.create');
    Route::post('/devolucoes', [ReturnController::class, 'store'])->name('returns.store');

    // Suporte / Tickets
    Route::get('/suporte', [SupportTicketController::class, 'index'])->name('tickets.index');
    Route::get('/suporte/criar', [SupportTicketController::class, 'create'])->name('tickets.create');
    Route::post('/suporte', [SupportTicketController::class, 'store'])->name('tickets.store');
    Route::get('/suporte/{ticket:uuid}', [SupportTicketController::class, 'show'])->name('tickets.show');
    Route::post('/suporte/{ticket:uuid}/reply', [SupportTicketController::class, 'reply'])->name('tickets.reply');

    Route::get('/favoritos', [AccountController::class, 'favorites'])->name('favorites');
    Route::post('/favoritos/toggle', [AccountController::class, 'toggleFavorite'])->name('favorites.toggle');
    Route::post('/favoritos/compartilhar', [AccountController::class, 'toggleWishlistSharing'])->name('favorites.share');

    Route::get('/pedidos', [AccountController::class, 'orders'])->name('orders.index');
    Route::get('/pedidos/{order:uuid}', [AccountController::class, 'orderShow'])->name('orders.show');

    // Comparações sincronizadas — #18
    Route::post('/comparacoes/sync', [AccountController::class, 'syncComparisons'])->name('comparisons.sync');
    Route::get('/comparacoes', [AccountController::class, 'getComparisons'])->name('comparisons.get');

    // Pontos de fidelidade — #15
    Route::get('/pontos', [AccountController::class, 'loyaltyPoints'])->name('loyalty');
});

// Wishlist compartilhada — acesso público — #12
Route::get('/wishlist/{token}', [AccountController::class, 'sharedWishlist'])->name('wishlist.shared');

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

    // Menu principal da loja
    Route::get('menu-items', [MenuItemController::class, 'index'])->name('menu-items.index');
    Route::post('menu-items', [MenuItemController::class, 'store'])->name('menu-items.store');
    Route::put('menu-items/{menuItem}', [MenuItemController::class, 'update'])->name('menu-items.update');
    Route::delete('menu-items/{menuItem}', [MenuItemController::class, 'destroy'])->name('menu-items.destroy');

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

    // Tabelas de Preço
    Route::get('price-lists', [PriceListController::class, 'index'])->name('price-lists.index');
    Route::post('price-lists', [PriceListController::class, 'store'])->name('price-lists.store');
    Route::put('price-lists/{priceList}', [PriceListController::class, 'update'])->name('price-lists.update');
    Route::delete('price-lists/{priceList}', [PriceListController::class, 'destroy'])->name('price-lists.destroy');
    Route::post('price-lists/product-price', [PriceListController::class, 'setProductPrice'])->name('price-lists.product-price.set');
    Route::delete('price-lists/product-price', [PriceListController::class, 'removeProductPrice'])->name('price-lists.product-price.remove');
    Route::get('price-lists/product/{product}/prices', [PriceListController::class, 'productPrices'])->name('price-lists.product-prices');

    // Empresas B2B
    Route::get('companies', [CompanyController::class, 'index'])->name('companies.index');
    Route::get('companies/{company:uuid}', [CompanyController::class, 'show'])->name('companies.show');
    Route::post('companies/{company:uuid}/approve', [CompanyController::class, 'approve'])->name('companies.approve');
    Route::post('companies/{company:uuid}/reject', [CompanyController::class, 'reject'])->name('companies.reject');
    Route::post('companies/{company:uuid}/suspend', [CompanyController::class, 'suspend'])->name('companies.suspend');
    Route::put('companies/{company:uuid}/commercial', [CompanyController::class, 'updateCommercial'])->name('companies.commercial');

    // Cotações admin
    Route::get('quotes', [QuoteAdminController::class, 'index'])->name('quotes.index');
    Route::get('quotes/{quote:uuid}', [QuoteAdminController::class, 'show'])->name('quotes.show');
    Route::put('quotes/{quote:uuid}', [QuoteAdminController::class, 'update'])->name('quotes.update');

    // Devoluções admin
    Route::get('returns', [ReturnAdminController::class, 'index'])->name('returns.index');
    Route::get('returns/{return:uuid}', [ReturnAdminController::class, 'show'])->name('returns.show');
    Route::patch('returns/{return:uuid}/status', [ReturnAdminController::class, 'updateStatus'])->name('returns.status');

    // Suporte admin
    Route::get('tickets', [SupportTicketAdminController::class, 'index'])->name('tickets.index');
    Route::get('tickets/{ticket:uuid}', [SupportTicketAdminController::class, 'show'])->name('tickets.show');
    Route::post('tickets/{ticket:uuid}/reply', [SupportTicketAdminController::class, 'reply'])->name('tickets.reply');
    Route::patch('tickets/{ticket:uuid}/status', [SupportTicketAdminController::class, 'updateStatus'])->name('tickets.status');

    // Bulk actions nos produtos
    Route::post('products/bulk', [BulkProductController::class, 'bulk'])->name('products.bulk');

    // Flash Sales
    Route::get('flash-sales', [AdminFlashSaleController::class, 'index'])->name('flash-sales.index');
    Route::post('flash-sales', [AdminFlashSaleController::class, 'store'])->name('flash-sales.store');
    Route::patch('flash-sales/{flashSale}/toggle', [AdminFlashSaleController::class, 'toggle'])->name('flash-sales.toggle');
    Route::delete('flash-sales/{flashSale}', [AdminFlashSaleController::class, 'destroy'])->name('flash-sales.destroy');

    // Importação CSV de produtos
    Route::get('products/import', [ProductImportController::class, 'index'])->name('products.import');
    Route::post('products/import', [ProductImportController::class, 'store'])->name('products.import.store');
    Route::get('products/import/template', [ProductImportController::class, 'template'])->name('products.import.template');

    // Integração / ERP
    Route::get('integration', [IntegrationController::class, 'index'])->name('integration.index');
    Route::post('integration/test-connection', [IntegrationController::class, 'testConnection'])->name('integration.test');
    Route::post('integration/sync', [IntegrationController::class, 'runSync'])->name('integration.sync');
    Route::delete('integration/logs', [IntegrationController::class, 'clearLogs'])->name('integration.logs.clear');
    Route::get('integration/schema', [IntegrationController::class, 'downloadSchema'])->name('integration.schema');

    // Newsletter
    Route::get('newsletter', [NewsletterAdminController::class, 'index'])->name('newsletter.index');
    Route::delete('newsletter/{subscriber}', [NewsletterAdminController::class, 'destroy'])->name('newsletter.destroy');
    Route::get('newsletter/export', [NewsletterAdminController::class, 'exportCsv'])->name('newsletter.export');
});
