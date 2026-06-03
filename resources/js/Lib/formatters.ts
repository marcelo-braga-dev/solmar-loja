export function formatBRL(cents: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(cents / 100);
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        ...options,
    }).format(new Date(date));
}

export function formatNumber(value: number, decimals = 0): string {
    return new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(value);
}

export function formatInstallment(cents: number, installments = 12): string {
    const installmentValue = cents / installments;
    return `${installments}x de ${formatBRL(installmentValue)}`;
}

export function slugify(text: string): string {
    return text
        .toString()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
}
