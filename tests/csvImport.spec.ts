import { describe, it, expect, beforeEach } from 'vitest'
import {
    parseCsvLine,
    splitTagCell,
    validateAndParseImport,
    executeImport,
} from '../src/utils/csvImport'
import { BarcodeDatabase, type Tag, type Barcode } from '../src/db'

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

    describe('splitTagCell', () => {
        it('splits on semicolons, trims, and drops empties', () => {
            expect(splitTagCell(' Shopping ; Work ;; ')).toEqual(['Shopping', 'Work'])
        });

        it('returns no tags for an empty cell', () => {
            expect(splitTagCell('')).toEqual([])
        });
    });

    describe('validateAndParseImport', () => {
        const tags: Tag[] = [
            { id: 'c1', name: 'Work' },
            { id: 'c2', name: 'tag 1' },
        ]

        const barcodes: Barcode[] = [
            { id: 'b1', type: 'qrcode', value: 'existing-123', tags: ['c1'], createdAt: 100 },
        ]

        it('imports a row with no tag as untagged', () => {
            const csvText = '123, qrcode'
            const result = validateAndParseImport(csvText, barcodes, tags)

            expect(result.errors).toEqual([])
            expect(result.skippedDuplicatesCount).toBe(0)
            expect(result.validRowsToImport).toEqual([
                { type: 'qrcode', value: '123', tagNames: [] },
            ])
        });

        it('treats untagged duplicates as duplicates of each other', () => {
            const csv1 = '123, qrcode\n123, qrcode'
            const res1 = validateAndParseImport(csv1, [], tags)
            expect(res1.errors).toEqual([])
            expect(res1.validRowsToImport).toHaveLength(1)
            expect(res1.skippedDuplicatesCount).toBe(1)

            // Example 2: 123, qrcode, tag 1 and 123, qrcode, tag 2 are not duplicates
            const csv2 = '123, qrcode, tag 1\n123, qrcode, tag 2'
            const res2 = validateAndParseImport(csv2, [], tags)
            expect(res2.errors).toEqual([])
            expect(res2.validRowsToImport).toHaveLength(2)
            expect(res2.skippedDuplicatesCount).toBe(0)

            // Example 3: 123, code39, tag 1 and 123, qrcode, tag 1 are not duplicates
            const csv3 = '123, code39, tag 1\n123, qrcode, tag 1'
            const res3 = validateAndParseImport(csv3, [], tags)
            expect(res3.errors).toEqual([])
            expect(res3.validRowsToImport).toHaveLength(2)
            expect(res3.skippedDuplicatesCount).toBe(0)
        });

        it('detects duplicates against existing database barcodes', () => {
            const csvText = 'existing-123, qrcode, Work'
            const result = validateAndParseImport(csvText, barcodes, tags)

            expect(result.errors).toEqual([])
            expect(result.validRowsToImport).toHaveLength(0)
            expect(result.skippedDuplicatesCount).toBe(1)
        });

        it('compares the full tag set when detecting duplicates', () => {
            // Existing barcode has only "Work"; a row with "Work;Home" is a different tag set
            const csvText = 'existing-123, qrcode, Work;Home'
            const result = validateAndParseImport(csvText, barcodes, tags)

            expect(result.skippedDuplicatesCount).toBe(0)
            expect(result.validRowsToImport).toEqual([
                { type: 'qrcode', value: 'existing-123', tagNames: ['Work', 'Home'] },
            ])
        });

        it('treats tag sets with different order and case as duplicates', () => {
            const csvText = 'a1, qrcode, Shopping;Work\na1, qrcode, work; SHOPPING'
            const result = validateAndParseImport(csvText, [], [])

            expect(result.validRowsToImport).toHaveLength(1)
            expect(result.skippedDuplicatesCount).toBe(1)
        });

        it('returns errors and imports nothing if any row has invalid fields', () => {
            // EAN13 with value 100 is invalid
            const csvText = '100, ean13\n4006381333931, ean13'
            const result = validateAndParseImport(csvText, [], tags)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0]).toContain('Row 1: EAN-13 requires exactly 12 or 13 numeric digits')
            expect(result.validRowsToImport).toEqual([])
        });

        it('returns errors if value or type is missing', () => {
            const csvText = 'qrcode\n' // missing value
            const result = validateAndParseImport(csvText, [], tags)

            expect(result.errors.length).toBeGreaterThan(0)
            expect(result.errors[0]).toContain('Row 1: Value is required')
            expect(result.validRowsToImport).toEqual([])
        });

        it('supports header rows', () => {
            const csvText = 'type,value,category\nqrcode,999,Work'
            const result = validateAndParseImport(csvText, [], tags)

            expect(result.errors).toEqual([])
            expect(result.validRowsToImport).toEqual([
                { type: 'qrcode', value: '999', tagNames: ['Work'] },
            ])
        });

        it('splits a multi-tag cell into separate tag names', () => {
            const csvText = 'type,value,category\nqrcode,999,"Shopping;Work"'
            const result = validateAndParseImport(csvText, [], [])

            expect(result.errors).toEqual([])
            expect(result.validRowsToImport).toEqual([
                { type: 'qrcode', value: '999', tagNames: ['Shopping', 'Work'] },
            ])
        });
    });

    describe('executeImport', () => {
        let testDb: BarcodeDatabase

        beforeEach(async () => {
            testDb = new BarcodeDatabase()
            await testDb.tags.clear()
            await testDb.barcodes.clear()
        });

        it('inserts new tags and barcodes into database', async () => {
            const initialTags: Tag[] = [{ id: 'c1', name: 'Work' }]
            await testDb.tags.add(initialTags[0]!)

            const rowsToImport = [
                { type: 'qrcode', value: 'ABC', tagNames: ['Work'] },
                { type: 'code39', value: 'XYZ', tagNames: ['New Tag'] },
            ]

            const result = await executeImport(rowsToImport, initialTags)

            expect(result.importedCount).toBe(2)
            expect(result.newTagsCount).toBe(1)

            const savedBarcodes = await testDb.barcodes.toArray()
            expect(savedBarcodes).toHaveLength(2)

            const savedTags = await testDb.tags.toArray()
            expect(savedTags).toHaveLength(2)
            expect(savedTags.map((c) => c.name)).toContain('new tag')
        });

        it('creates every tag in a multi-tag row and applies all of them', async () => {
            const result = await executeImport(
                [{ type: 'qrcode', value: 'M1', tagNames: ['Shopping', 'Work'] }],
                [],
            )

            expect(result.newTagsCount).toBe(2)

            const tags = await testDb.tags.toArray()
            const barcode = (await testDb.barcodes.toArray())[0]!
            const appliedNames = barcode.tags.map((id) => tags.find((t) => t.id === id)?.name)
            expect(appliedNames.sort()).toEqual(['shopping', 'work'])
        });

        it('imports an untagged row with no tags', async () => {
            await executeImport([{ type: 'qrcode', value: 'N1', tagNames: [] }], [])

            const barcode = (await testDb.barcodes.toArray())[0]!
            expect(barcode.tags).toEqual([])
        });

        it('reuses an existing tag when names differ only by case', async () => {
            const existing: Tag[] = [{ id: 'c1', name: 'Work' }]
            await testDb.tags.add(existing[0]!)

            const result = await executeImport(
                [{ type: 'qrcode', value: 'W1', tagNames: ['WORK'] }],
                existing,
            )

            expect(result.newTagsCount).toBe(0)
            const barcode = (await testDb.barcodes.toArray())[0]!
            expect(barcode.tags).toEqual(['c1'])
        });
    });
});
