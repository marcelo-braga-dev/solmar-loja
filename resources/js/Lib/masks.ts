/**
 * Funções de máscara para campos de formulário.
 * Todas as funções recebem o valor digitado e retornam o valor mascarado.
 */

/** Remove tudo que não for dígito */
export const onlyDigits = (v: string): string => v.replace(/\D/g, '');

/** CEP: 99999-999 */
export const maskCep = (v: string): string => {
    const d = onlyDigits(v).slice(0, 8);
    if (d.length <= 5) return d;
    return `${d.slice(0, 5)}-${d.slice(5)}`;
};

/** CPF: 999.999.999-99 */
export const maskCpf = (v: string): string => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

/** CNPJ: 99.999.999/9999-99 */
export const maskCnpj = (v: string): string => {
    const d = onlyDigits(v).slice(0, 14);
    if (d.length <= 2)  return d;
    if (d.length <= 5)  return `${d.slice(0, 2)}.${d.slice(2)}`;
    if (d.length <= 8)  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
    if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
};

/**
 * CPF ou CNPJ — aplica a máscara correta conforme o número de dígitos.
 * Até 11 dígitos → CPF. 12-14 dígitos → CNPJ.
 */
export const maskCpfCnpj = (v: string): string => {
    const d = onlyDigits(v);
    if (d.length <= 11) return maskCpf(v);
    return maskCnpj(v);
};

/**
 * Telefone inteligente — aplica máscara de fixo ou celular automaticamente.
 * 10 dígitos → (99) 9999-9999 (fixo)
 * 11 dígitos → (99) 99999-9999 (celular)
 */
export const maskPhone = (v: string): string => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length === 0)  return '';
    if (d.length <= 2)   return `(${d}`;
    if (d.length <= 6)   return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10)  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/** Telefone fixo: (99) 9999-9999 */
export const maskPhoneFixed = (v: string): string => {
    const d = onlyDigits(v).slice(0, 10);
    if (d.length <= 2)  return `(${d}`;
    if (d.length <= 6)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
};

/** Celular: (99) 99999-9999 */
export const maskCellphone = (v: string): string => {
    const d = onlyDigits(v).slice(0, 11);
    if (d.length <= 2)  return `(${d}`;
    if (d.length <= 7)  return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};

/** Placa de veículo: AAA-9999 ou AAA9A99 (Mercosul) */
export const maskPlate = (v: string): string => {
    const clean = v.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 7);
    if (clean.length <= 3) return clean;
    return `${clean.slice(0, 3)}-${clean.slice(3)}`;
};

/** Moeda BRL: digita 1234 → R$ 12,34 (centavos → reais on-the-fly) */
export const maskCurrency = (v: string): string => {
    const d = onlyDigits(v).replace(/^0+/, '') || '0';
    const cents = d.padStart(3, '0');
    const reals = cents.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return `R$ ${reals},${cents.slice(-2)}`;
};

/** Retorna só os dígitos de uma máscara de moeda (em centavos) */
export const currencyToCents = (masked: string): number =>
    parseInt(onlyDigits(masked) || '0', 10);

/** Retorna a máscara correta de telefone para um placeholder */
export const phonePlaceholder = (isCellphone = true): string =>
    isCellphone ? '(11) 99999-9999' : '(11) 9999-9999';

/** Valida CPF (algoritmo completo) */
export const validateCpf = (cpf: string): boolean => {
    const d = onlyDigits(cpf);
    if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(d[i]) * (10 - i);
    let rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    if (rem !== parseInt(d[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(d[i]) * (11 - i);
    rem = (sum * 10) % 11;
    if (rem === 10 || rem === 11) rem = 0;
    return rem === parseInt(d[10]);
};

/** Valida CNPJ (algoritmo completo) */
export const validateCnpj = (cnpj: string): boolean => {
    const d = onlyDigits(cnpj);
    if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
    const calc = (n: number) => {
        let sum = 0;
        const weights = n === 1
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        for (let i = 0; i < weights.length; i++) sum += parseInt(d[i]) * weights[i];
        const rem = sum % 11;
        return rem < 2 ? 0 : 11 - rem;
    };
    return calc(1) === parseInt(d[12]) && calc(2) === parseInt(d[13]);
};

/** Valida CPF ou CNPJ automaticamente */
export const validateCpfCnpj = (v: string): boolean => {
    const d = onlyDigits(v);
    if (d.length === 11) return validateCpf(v);
    if (d.length === 14) return validateCnpj(v);
    return false;
};
