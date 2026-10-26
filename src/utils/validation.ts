/**
 * Validates GS1 Mod-10 check digit for 13-digit EAN-13 barcodes.
 */
export const validateEan13CheckDigit = (value: string): boolean => {
    if (value.length !== 13) return true;
    const digits = value.split('').map(Number);
    const checksum = digits.slice(0, 12).reduce((sum, d, i) => {
        return sum + (i % 2 === 0 ? d : d * 3);
    }, 0);
    const calculatedCheckDigit = (10 - (checksum % 10)) % 10;
    return digits[12] === calculatedCheckDigit;
};

/**
 * Validates a normalised tag name. Only a-z, 0-9 and spaces are allowed.
 * Returns an error message if invalid, or empty string if valid.
 */
export const getTagNameError = (name: string): string => {
    if (!name) return 'Name is required';
    if (!/^[a-z0-9 ]+$/.test(name)) {
        return 'Tags can only contain letters a–z, numbers 0–9 and spaces';
    }
    return '';
};

export const NOTE_MAX_LENGTH = 128;

/**
 * Validates a barcode note. Plain text only: no angle brackets, and at most NOTE_MAX_LENGTH characters.
 * Returns an error message if invalid, or empty string if valid.
 */
export const getNoteError = (note: string): string => {
    if (note.length > NOTE_MAX_LENGTH) {
        return `Note must be ${NOTE_MAX_LENGTH} characters or fewer`;
    }
    if (/[<>]/.test(note)) {
        return 'Note cannot contain < or > characters';
    }
    return '';
};

/**
 * Validates barcode input value based on selected barcode type.
 * Returns an error message if invalid, or empty string if valid.
 */
export const getValidationError = (type: string, value: string): string => {
    if (!value) return '';
    switch (type) {
        case 'ean13':
            if (!/^\d{12,13}$/.test(value)) {
                return 'EAN-13 requires exactly 12 or 13 numeric digits';
            }
            if (value.length === 13 && !validateEan13CheckDigit(value)) {
                return 'Invalid check digit — try entering just 12 digits so the app computes it';
            }
            break;
        case 'code39':
            if (!/^[A-Z0-9 \-.$/+%]+$/.test(value)) {
                return 'Code 39 only supports A–Z, 0–9 and - . $ / + % SPACE';
            }
            break;
    }
    return '';
};
