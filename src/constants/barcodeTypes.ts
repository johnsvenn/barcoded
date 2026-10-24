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
