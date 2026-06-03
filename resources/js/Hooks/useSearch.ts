import { useState, useCallback, useRef } from 'react';
import axios from '@/Lib/axios';

interface SearchResult {
    name: string;
    slug: string;
    price_cents?: number;
    cover_image?: string;
}

interface SearchResults {
    products: SearchResult[];
    categories: { name: string; slug: string }[];
}

export function useSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResults>({ products: [], categories: [] });
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const search = useCallback((q: string) => {
        setQuery(q);

        if (debounceRef.current) {
            clearTimeout(debounceRef.current);
        }

        if (q.length < 2) {
            setResults({ products: [], categories: [] });
            setOpen(false);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await axios.get<SearchResults>('/api/search/autocomplete', { params: { q } });
                setResults(res.data);
                setOpen(true);
            } catch {
                setResults({ products: [], categories: [] });
            } finally {
                setLoading(false);
            }
        }, 300);
    }, []);

    const close = () => setOpen(false);

    return { query, results, loading, open, search, close };
}
