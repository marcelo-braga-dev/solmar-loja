export interface Category {
    id: number;
    uuid?: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    icon?: string;
    position?: number;
    is_active?: boolean;
    parent_id?: number | null;
    depth?: number;
    children?: Category[];
    siblings?: Category[];
    breadcrumbs?: { name: string; slug?: string }[];
}

export interface Brand {
    id: number;
    name: string;
    slug: string;
    logo?: string;
    website?: string;
    is_active?: boolean;
    products_count?: number;
}

export interface ProductImage {
    id?: number;
    url: string;
    alt: string;
    is_cover?: boolean;
    position?: number;
}

export interface ProductVariant {
    id: number;
    sku: string;
    name?: string;
    price_cents: number;
    is_active: boolean;
    attributes?: Record<string, unknown>;
}

export interface Product {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    sku: string;
    short_description?: string;
    description?: string;
    price_cents: number;
    compare_at_price_cents?: number;
    cost_cents?: number;
    status?: string;
    status_label?: string;
    status_color?: string;
    brand_id?: number;
    brand?: Brand | null;
    brand_name?: string;
    categories?: Category[];
    category_ids?: number[];
    featured: boolean;
    is_favorite?: boolean;
    stock_quantity?: number;
    has_discount: boolean;
    discount_percent: number;
    weight_grams?: number;
    length_mm?: number;
    width_mm?: number;
    height_mm?: number;
    specifications?: Record<string, string> | null;
    meta_title?: string;
    meta_description?: string;
    external_id?: string;
    published_at?: string;
    created_at?: string;
    cover_image?: string;
    images?: ProductImage[];
    variants?: ProductVariant[];
    breadcrumbs?: { name: string; slug?: string }[];
}

export interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface ProductFilters {
    q?: string;
    brand?: number;
    price_min?: number;
    price_max?: number;
    in_stock?: boolean;
    on_sale?: boolean;
    sort?: string;
    attrs?: number[];
    categories?: number[];
}

export interface FacetValue {
    id: number;
    value: string;
    count: number;
}

export interface Facet {
    id: number;
    name: string;
    values: FacetValue[];
}
