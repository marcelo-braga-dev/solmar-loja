import { useState, useEffect } from 'react';
import { TextField, InputAdornment, CircularProgress, Tooltip } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { maskCep, onlyDigits } from '@/Lib/masks';
import { useCep, type CepResult } from '@/Hooks/useCep';

interface Props {
    value: string;
    onChange: (masked: string) => void;
    onFill: (data: CepResult) => void;
    error?: string;
    label?: string;
    size?: 'small' | 'medium';
    fullWidth?: boolean;
    required?: boolean;
}

export default function CepField({
    value, onChange, onFill,
    error, label = 'CEP', size = 'small', fullWidth = true, required = false,
}: Props) {
    const { loading, error: cepError, fetchCep } = useCep();
    const [filled, setFilled] = useState(false);

    const handleChange = async (raw: string) => {
        const masked = maskCep(raw);
        onChange(masked);
        setFilled(false);

        if (onlyDigits(masked).length === 8) {
            const data = await fetchCep(masked);
            if (data) {
                onFill(data);
                setFilled(true);
            }
        }
    };

    // Resetar estado quando valor externo mudar (ex.: troca de endereço)
    useEffect(() => {
        if (onlyDigits(value).length < 8) setFilled(false);
    }, [value]);

    const adornment = loading ? (
        <CircularProgress size={16} />
    ) : filled ? (
        <Tooltip title="CEP encontrado!">
            <CheckCircleIcon sx={{ fontSize: 18, color: 'success.main' }} />
        </Tooltip>
    ) : cepError ? (
        <Tooltip title={cepError}>
            <ErrorIcon sx={{ fontSize: 18, color: 'error.main' }} />
        </Tooltip>
    ) : (
        <SearchIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
    );

    return (
        <TextField
            label={label}
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            error={!!error || !!cepError}
            helperText={error ?? cepError ?? undefined}
            placeholder="00000-000"
            fullWidth={fullWidth}
            size={size}
            required={required}
            slotProps={{
                input: {
                    endAdornment: (
                        <InputAdornment position="end">{adornment}</InputAdornment>
                    ),
                    inputProps: { maxLength: 9 },
                },
            }}
        />
    );
}
