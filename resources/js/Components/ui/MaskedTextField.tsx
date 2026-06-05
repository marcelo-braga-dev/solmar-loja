import { TextField, type TextFieldProps } from '@mui/material';
import type { MaskFn } from '@/Types/masks';

type Props = Omit<TextFieldProps, 'onChange'> & {
    mask: MaskFn;
    value: string;
    onChange: (masked: string, raw: string) => void;
};

/**
 * TextField com aplicação automática de máscara.
 * A função `mask` recebe o valor digitado e retorna o valor formatado.
 * O callback `onChange` recebe (valor_mascarado, só_dígitos).
 */
export default function MaskedTextField({ mask, value, onChange, ...rest }: Props) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const masked = mask(e.target.value);
        const raw    = masked.replace(/\D/g, '');
        onChange(masked, raw);
    };

    return (
        <TextField
            value={value}
            onChange={handleChange}
            {...rest}
        />
    );
}
