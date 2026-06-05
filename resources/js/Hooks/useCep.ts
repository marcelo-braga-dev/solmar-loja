import { useState, useCallback } from 'react';
import { onlyDigits } from '@/Lib/masks';

export interface CepResult {
    cep: string;
    logradouro: string;   // rua/av.
    complemento: string;
    bairro: string;
    localidade: string;   // cidade
    uf: string;           // estado
    ibge: string;
    erro?: boolean;
}

export interface UseCepReturn {
    loading: boolean;
    error: string | null;
    fetchCep: (cep: string) => Promise<CepResult | null>;
}

export function useCep(): UseCepReturn {
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState<string | null>(null);

    const fetchCep = useCallback(async (cep: string): Promise<CepResult | null> => {
        const clean = onlyDigits(cep);
        if (clean.length !== 8) return null;

        setLoading(true);
        setError(null);

        try {
            const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`, {
                signal: AbortSignal.timeout(6000),
            });

            if (!res.ok) {
                setError('Erro ao consultar o CEP. Tente novamente.');
                return null;
            }

            const data: CepResult = await res.json();

            if (data.erro) {
                setError('CEP não encontrado. Verifique e tente novamente.');
                return null;
            }

            return data;
        } catch (e) {
            setError('Não foi possível consultar o CEP. Verifique sua conexão.');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    return { loading, error, fetchCep };
}
