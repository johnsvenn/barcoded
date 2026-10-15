import { describe, it, expect, beforeEach } from 'vitest'
import {
    parseCsvLine,
    validateAndParseImport,
    executeImport,
} from '../src/utils/csvImport'
import { BarcodeDatabase, type Category, type Barcode } from '../src/db'

describe('csvImport utility', () => {
    describe('parseCsvLine', () => {
        it('splits basic comma separated values', () => {
            expect(parseCsvLine('123, qrcode, Work')).toEqual(['123', 'qrcode', 'Work'])
        });

        it('handles quoted fields with commas inside', () => {
            expect(parseCsvLine('"123,456", qrcode, "Work, Special"')).toEqual([
                '123,456',
                'qrcode',
                'Work, Special',
            ])
        });
    });

    describe('validateAndParseImport', () => {
        const categories: Category[] = [
            { id: 'c1', name: 'Uncategorized' },
            { id: 'c2', name: 'category 1' },
        ]

        const barcodes: Barcode[] = [
            { id: 'b1', type: 'qrcode', value: 'existing-123', categoryId: 'c1', createdAt: 100 },
        ]

        it('defaults category to Uncategorized if not provided', () => {
            const csvText = '123, qrcode'
            const result = validateAndParseImport(csvText, barcodes, categories)

            expect(result.errors).toEqual([])
            expect(result.skippedDuplicatesCount).toBe(0)
            expect(result.validRowsToImport).toEqual([
                { type: 'qrcode', value: '123', categoryName: 'Uncategorized' },
            ])
        });

        it('correctly handles user prompt examples of duplicates and non-duplicates', () => {
            // Example 1: 123, qrcode and 123, qrcode are duplicates because they default Uncategorized
            const csv1 = '123, qrcode\n123, qrcode'
            const res1 = validateAndParseImport(csv1, [], categories)
            expect(res1.errors).toEqual([])
            expect(res1.validRowsToImport).toHaveLength(1)
            expect(res1.skippedDuplicatesCount).toBe(1)

            // Example 2: 123, qrcode, category 1 and 123, qrcode, category 2 are not duplicates
            const csv2 = '123, qrcode, category 1\n123, qrcode, category 2'
            const res2 = validateAndParseImport(csv2, [], categories)
            expect(res2.errors).toEqual([])
            expect(res2.validRowsToImport).toHaveLength(2)
            expect(res2.skippedDuplicatesCount).toBe(0)

            // Example 3: 123, code39, category 1 and 123, qrcode, category 1 are not duplicates
            const csv3 = '123, code39, category 1\n123, qrcode, category 1'
            const res3 = validateAndParseImport(csv3, [], categories)
            expect(res3.errors).toEqual([])
            expect(res3.validRowsToImport).toHaveLength(2)
            expect(res3.skippedDuplicatesCount).toBe(0)
        });

        it('detects duplicates against existing database barcodes', () => {
            const csvText = 'existing-123, qrcode'
            const result = validateAndParseImport(csvText, barcodes, categories)

            expect(result.errors).toEqual([])
            expect(result.validRowsToImport).toHaveLength(0)
            expect(result.skippedDuplicatesCount).toBe(1)
        });

        it('returns errors and imports nothing if any row has invalid fields', () => {
            // EAN13 with value 100 is invalid
            const csvText = '100, ean13\n4006381333931, ean13'
            const result = validateAndParseImport(csvText, [], categories)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0]).toContain('Row 1: EAN-13 requires exactly 12 or 13 numeric digits')
            expect(result.validRowsToImport).toEqual([])
        });

        it('returns errors if value or type is missing', () => {
            const csvText = 'qrcode\n' // missing value
            const result = validateAndParseImport(csvText, [], categories)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0]).toContain('Row 1: Value is required')
            expect(result.validRowsToImport).toEqual([])
        });

        it('supports header rows', () => {
            const csvText = 'type,value,category\nqrcode,999,Work'
            const result = validateAndParseImport(csvText, [], categories)

            expect(result.errors).toEqual([])
            expect(result.validRowsToImport).toEqual([
                { type: 'qrcode', value: '999', categoryName: 'Work' },
            ])
        });
    });

    describe('executeImport', () => {
        let testDb: BarcodeDatabase

        beforeEach(async () => {
            testDb = new BarcodeDatabase()
            await testDb.categories.clear()
            await testDb.barcodes.clear()
        });

        it('inserts new categories and barcodes into database', async () => {
            const initialCats: Category[] = [{ id: 'c1', name: 'Uncategorized' }]
            await testDb.categories.add(initialCats[0]!)

            const rowsToImport = [
                { type: 'qrcode', value: 'ABC', categoryName: 'Uncategorized' },
                { type: 'code39', value: 'XYZ', categoryName: 'New Category' },
            ]

            const result = await executeImport(rowsToImport, initialCats)

            expect(result.importedCount).toBe(2)
            expect(result.newCategoriesCount).toBe(1)

            const savedBarcodes = await testDb.barcodes.toArray()
            expect(savedBarcodes).toHaveLength(2)

            const savedCats = await testDb.categories.toArray()
            expect(savedCats).toHaveLength(2)
            expect(savedCats.map((c) => c.name)).toContain('New Category')
        });
    });
});
