export interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    is_admin: boolean;
    is_super_admin: boolean;
}

export interface Auth {
    user: User | null;
}

export interface Flash {
    success?: string;
    error?: string;
    info?: string;
    warning?: string;
}

export interface Branding {
    store_name: string;
    store_tagline: string;
    store_description: string;
    logo_url: string;
    logo_dark_url: string;
    favicon_url: string;
    primary_color: string;
    secondary_color: string;
    dark_bg_color: string;
    store_email: string;
    store_phone: string;
    store_address: string;
    store_cnpj: string;
    footer_text: string;
    social_whatsapp: string;
    social_instagram: string;
    social_facebook: string;
    social_youtube: string;
    social_linkedin: string;
    free_shipping_min_cents: number;
    free_shipping_enabled: boolean;
}

export interface PriceListInfo {
    id: number;
    name: string;
    code: string;
    discount_percent: number;
    type: string;
}

export interface MainMenuItem {
    label: string;
    href: string;
}

export interface SharedProps {
    auth: Auth;
    flash: Flash;
    cartCount: number;
    notifyCount: number;
    branding: Branding;
    priceList: PriceListInfo | null;
    mainMenu: MainMenuItem[];
    [key: string]: unknown;
}

declare module '@inertiajs/react' {
    interface PageProps extends SharedProps {}
}
