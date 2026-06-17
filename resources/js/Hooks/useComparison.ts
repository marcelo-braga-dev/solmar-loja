import { useState, useCallback, useEffect, useRef } from 'react';
import { usePage } from '@inertiajs/react';
import axios from '@/Lib/axios';
import type { SharedProps } from '@/Types/inertia';

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
    const { auth } = usePage<SharedProps>().props;
    const isAuth = !!auth?.user;

    const [items, setItems] = useState<CompareProduct[]>(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
        } catch {
            return [];
        }
    });

    // Sync flag to avoid re-entrant syncs
    const syncing = useRef(false);

    // On mount, if authenticated, restore from server (device sync)
    useEffect(() => {
        if (!isAuth) return;
        axios.get<{ products: CompareProduct[] }>('/conta/comparacoes')
            .then((res) => {
                const serverItems = res.data.products;
                if (serverItems.length > 0) {
                    setItems(serverItems);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(serverItems));
                }
            })
            .catch(() => { /* silently ignore — keep local state */ });
    }, [isAuth]);

    // Persist to localStorage on every change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }, [items]);

    // Sync to server when authenticated (debounced)
    const syncToServer = useCallback((currentItems: CompareProduct[]) => {
        if (!isAuth || syncing.current) return;
        syncing.current = true;
        axios.post('/conta/comparacoes/sync', { product_ids: currentItems.map((p) => p.id) })
            .catch(() => { /* silently ignore */ })
            .finally(() => { syncing.current = false; });
    }, [isAuth]);

    const add = useCallback((product: CompareProduct) => {
        setItems(prev => {
            if (prev.some(p => p.id === product.id)) return prev;
            if (prev.length >= MAX_ITEMS) return prev;
            const next = [...prev, product];
            syncToServer(next);
            return next;
        });
    }, [syncToServer]);

    const remove = useCallback((id: number) => {
        setItems(prev => {
            const next = prev.filter(p => p.id !== id);
            syncToServer(next);
            return next;
        });
    }, [syncToServer]);

    const toggle = useCallback((product: CompareProduct) => {
        setItems(prev => {
            let next: CompareProduct[];
            if (prev.some(p => p.id === product.id)) {
                next = prev.filter(p => p.id !== product.id);
            } else {
                if (prev.length >= MAX_ITEMS) return prev;
                next = [...prev, product];
            }
            syncToServer(next);
            return next;
        });
    }, [syncToServer]);

    const clear = useCallback(() => {
        setItems([]);
        syncToServer([]);
    }, [syncToServer]);

    const isInComparison = useCallback((id: number) => items.some(p => p.id === id), [items]);

    const canAdd = items.length < MAX_ITEMS;

    return { items, add, remove, toggle, clear, isInComparison, canAdd, count: items.length };
}
