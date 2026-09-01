export interface MercadoPagoCardFormData {
    token: string;
    paymentMethodId: string;
    issuerId: string;
    cardholderEmail: string;
    amount: string;
    installments: string;
    identificationType: string;
    identificationNumber: string;
}

export interface MercadoPagoCardForm {
    getCardFormData: () => MercadoPagoCardFormData;
    unmount: () => void;
}

export interface MercadoPagoCardFormFieldConfig {
    id: string;
    placeholder?: string;
}

export interface MercadoPagoCardFormConfig {
    amount: string;
    iframe?: boolean;
    form: {
        id: string;
        cardNumber: MercadoPagoCardFormFieldConfig;
        expirationDate: MercadoPagoCardFormFieldConfig;
        securityCode: MercadoPagoCardFormFieldConfig;
        cardholderName: MercadoPagoCardFormFieldConfig;
        issuer: MercadoPagoCardFormFieldConfig;
        installments: MercadoPagoCardFormFieldConfig;
        identificationType: MercadoPagoCardFormFieldConfig;
        identificationNumber: MercadoPagoCardFormFieldConfig;
        cardholderEmail: MercadoPagoCardFormFieldConfig;
    };
    callbacks: {
        onFormMounted?: (error?: unknown) => void;
        onError?: (error: unknown) => void;
        onSubmit?: (event: Event) => void;
    };
}

export interface MercadoPagoInstance {
    cardForm: (config: MercadoPagoCardFormConfig) => MercadoPagoCardForm;
}

declare global {
    interface Window {
        MercadoPago: new (publicKey: string, options?: { locale?: string }) => MercadoPagoInstance;
    }
}
