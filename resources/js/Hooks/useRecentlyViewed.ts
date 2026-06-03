import { useEffect } from 'react';

const STORAGE_KEY = 'solarhub_recently_viewed';
const MAX_ITEMS   = 8;

export interface RecentProduct {
    id: number;
    name: string;
    slug: string;
    price_cents: number;
    cover_image: string | null;
    brand_name: string | null;
}

export function trackProductView(product: RecentProduct): void {
    try {
        const existing = getRecentlyViewed();
        const filtered = existing.filter((p) => p.id !== product.id);
        const updated  = [product, ...filtered].slice(0, MAX_ITEMS);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
        // localStorage pode estar desabilitado
    }
}

export function getRecentlyViewed(): RecentProduct[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function useTrackView(product: RecentProduct): void {
    useEffect(() => {
        trackProductView(product);
    }, [product.id]);
}
