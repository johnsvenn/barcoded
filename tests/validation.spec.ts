import { describe, expect, it } from 'vitest';
import { getTagNameError, getValidationError, validateEan13CheckDigit } from '../src/utils/validation';

describe('Validation Utilities', () => {
    describe('validateEan13CheckDigit', () => {
        it('returns true for 12-digit payloads (check digit not present yet)', () => {
            expect(validateEan13CheckDigit('123456789123')).toBe(true);
        });

        it('returns true for a valid 13-digit EAN-13', () => {
            // 400638133393 -> calculated check digit is 1
            expect(validateEan13CheckDigit('4006381333931')).toBe(true);
        });

        it('returns false for an invalid 13-digit EAN-13', () => {
            // 1234567891234 has invalid check digit 4 (correct check digit is 1)
            expect(validateEan13CheckDigit('1234567891234')).toBe(false);
        });
    });

    describe('getValidationError', () => {
        it('returns empty string for empty input', () => {
            expect(getValidationError('ean13', '')).toBe('');
            expect(getValidationError('code39', '')).toBe('');
        });

        it('validates EAN-13 length requirements', () => {
            expect(getValidationError('ean13', '12345')).toBe('EAN-13 requires exactly 12 or 13 numeric digits');
            expect(getValidationError('ean13', '12345678901234')).toBe('EAN-13 requires exactly 12 or 13 numeric digits');
            expect(getValidationError('ean13', '12345678901a')).toBe('EAN-13 requires exactly 12 or 13 numeric digits');
        });

        it('returns check digit error message for invalid 13-digit EAN-13', () => {
            expect(getValidationError('ean13', '1234567891234')).toBe(
                'Invalid check digit — try entering just 12 digits so the app computes it'
            );
        });

        it('returns empty string for valid 12-digit and 13-digit EAN-13', () => {
            expect(getValidationError('ean13', '123456789128')).toBe('');
            expect(getValidationError('ean13', '4006381333931')).toBe('');
        });

        it('validates Code 39 allowed characters', () => {
            expect(getValidationError('code39', 'CODE-39 123')).toBe('');
            expect(getValidationError('code39', 'INVALID@CHAR')).toBe(
                'Code 39 only supports A–Z, 0–9 and - . $ / + % SPACE'
            );
        });
    });

    describe('getTagNameError', () => {
        it('accepts letters, numbers and spaces', () => {
            expect(getTagNameError('work 2 go')).toBe('');
        });

        it('rejects punctuation, symbols and non-ASCII letters', () => {
            const message = 'Tags can only contain letters a–z, numbers 0–9 and spaces';
            expect(getTagNameError("mom's")).toBe(message);
            expect(getTagNameError('a;b')).toBe(message);
            expect(getTagNameError('café')).toBe(message);
        });

        it('requires a name', () => {
            expect(getTagNameError('')).toBe('Name is required');
        });
    });
});
