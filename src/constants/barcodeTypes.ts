export interface BarcodeTypeDef {
    label: string
    value: string
    bcid: string
}

export const BARCODE_TYPES: BarcodeTypeDef[] = [
    { label: 'QR Code', value: 'qrcode', bcid: 'qrcode' },
    { label: 'Code 39', value: 'code39', bcid: 'code39' },
    { label: 'EAN-13', value: 'ean13', bcid: 'ean13' },
    { label: 'Code 128', value: 'code128', bcid: 'code128' },
];

export const KNOWN_BARCODE_TYPE_VALUES: string[] = BARCODE_TYPES.map((t) => t.value);

export const DEFAULT_BARCODE_TYPE = 'code39';
const DEFAULT_BARCODE_TYPE_KEY = 'defaultBarcodeType';

export const getDefaultBarcodeType = (): string => {
    try {
        const stored = localStorage.getItem(DEFAULT_BARCODE_TYPE_KEY);
        return stored && KNOWN_BARCODE_TYPE_VALUES.includes(stored) ? stored : DEFAULT_BARCODE_TYPE;
    } catch {
        return DEFAULT_BARCODE_TYPE;
    }
};

export const setDefaultBarcodeType = (value: string) => {
    try {
        localStorage.setItem(DEFAULT_BARCODE_TYPE_KEY, value);
    } catch {
        // Storage unavailable; the default simply won't persist.
    }
};
