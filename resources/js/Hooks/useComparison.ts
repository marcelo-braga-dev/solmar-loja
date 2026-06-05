import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'solarhub_compare';
const MAX_ITEMS   = 4;

export interface CompareProduct {
    id: number;
    name: string;
    slug: string;
    price_cents: number;
    cover_image: string | null;
    brand_name: string | null;
    specifications?: Record<string, string> | null;
}

export function useComparison() {
    const [items, setItems] = useState<CompareProduct[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        } catch {
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    const add = useCallback((product: CompareProduct) => {
        setItems(prev => {
            if (prev.some(p => p.id === product.id)) return prev;
            if (prev.length >= MAX_ITEMS) return prev;
            return [...prev, product];
        });
    }, []);

    const remove = useCallback((id: number) => {
        setItems(prev => prev.filter(p => p.id !== id));
    }, []);

    const toggle = useCallback((product: CompareProduct) => {
        setItems(prev => {
            if (prev.some(p => p.id === product.id)) {
                return prev.filter(p => p.id !== product.id);
            }
            if (prev.length >= MAX_ITEMS) return prev;
            return [...prev, product];
        });
    }, []);

    const clear = useCallback(() => setItems([]), []);

    const isInComparison = useCallback((id: number) => items.some(p => p.id === id), [items]);

    const canAdd = items.length < MAX_ITEMS;

    return { items, add, remove, toggle, clear, isInComparison, canAdd, count: items.length };
}
