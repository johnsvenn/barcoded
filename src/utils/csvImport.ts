import { v4 as uuidv4 } from 'uuid'
import { db, type Barcode, type Category } from '../db'
import { getValidationError } from './validation'
import { KNOWN_BARCODE_TYPE_VALUES } from '../constants/barcodeTypes'
import { resolveTagIds, tagKey } from './tags'

export interface ParsedCsvRow {
    lineNumber: number
    type: string
    value: string
    tagNames: string[]
}

export interface ImportValidationResult {
    errors: string[]
    validRowsToImport: Array<{
        type: string
        value: string
        tagNames: string[]
    }>
    skippedDuplicatesCount: number
}

/**
 * Splits a category cell into tag names, e.g. "Shopping;Work" -> ["Shopping", "Work"].
 */
export const splitTagCell = (cell: string): string[] =>
    cell
        .split(';')
        .map((name) => name.trim())
        .filter(Boolean)

/**
 * Key for a set of tag names. Order and case don't matter.
 */
const tagSetKey = (names: string[]): string =>
    [...new Set(names.map(tagKey))].sort().join(';')

/**
 * Parses a CSV line respecting quoted strings with commas and escaped quotes.
 */
export const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
        const char = line[i]

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"'
                i++
            } else {
                inQuotes = !inQuotes
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim())
            current = ''
        } else {
            current += char
        }
    }
    result.push(current.trim())
    return result
}

/**
 * Splits raw CSV text into non-empty lines and field arrays with line numbers.
 */
export const parseCsvText = (csvText: string): Array<{ lineNumber: number; fields: string[] }> => {
    const rawLines = csvText.split(/\r?\n/)
    const parsedLines: Array<{ lineNumber: number; fields: string[] }> = []

    for (let i = 0; i < rawLines.length; i++) {
        const line = rawLines[i]?.trim() ?? ''
        if (!line) continue
        const fields = parseCsvLine(line)
        parsedLines.push({ lineNumber: i + 1, fields })
    }

    return parsedLines
}

/**
 * Validates all fields in CSV text and prepares rows for import.
 * Returns validation errors if any row is invalid (excluding duplicates).
 */
export const validateAndParseImport = (
    csvText: string,
    existingBarcodes: Barcode[],
    existingCategories: Category[],
): ImportValidationResult => {
    const parsedLines = parseCsvText(csvText)

    if (parsedLines.length === 0) {
        return {
            errors: ['The selected CSV file is empty.'],
            validRowsToImport: [],
            skippedDuplicatesCount: 0,
        }
    }

    // Check if the first line is a header
    const firstLine = parsedLines[0]?.fields ?? []
    const lowerFirstLine = firstLine.map((f) => f.toLowerCase())

    let typeCol = -1
    let valueCol = -1
    let categoryCol = -1
    let hasHeader = false

    const hasTypeHeader = lowerFirstLine.some((f) => ['type', 'bcid', 'format', 'kind'].includes(f))
    const hasValueHeader = lowerFirstLine.some((f) => ['value', 'val', 'code', 'data'].includes(f))

    if (hasTypeHeader || hasValueHeader) {
        hasHeader = true
        typeCol = lowerFirstLine.findIndex((f) => ['type', 'bcid', 'format', 'kind'].includes(f))
        valueCol = lowerFirstLine.findIndex((f) => ['value', 'val', 'code', 'data'].includes(f))
        categoryCol = lowerFirstLine.findIndex((f) => ['category', 'cat', 'group'].includes(f))
    }

    const dataLines = hasHeader ? parsedLines.slice(1) : parsedLines

    if (dataLines.length === 0) {
        return {
            errors: ['The CSV file contains headers but no data rows.'],
            validRowsToImport: [],
            skippedDuplicatesCount: 0,
        }
    }

    const errors: string[] = []
    const parsedRows: ParsedCsvRow[] = []

    for (const item of dataLines) {
        const { lineNumber, fields } = item

        let type = ''
        let value = ''
        let category = ''

        if (hasHeader) {
            type = typeCol >= 0 && fields[typeCol] !== undefined ? fields[typeCol]! : ''
            value = valueCol >= 0 && fields[valueCol] !== undefined ? fields[valueCol]! : ''
            category = categoryCol >= 0 && fields[categoryCol] !== undefined ? fields[categoryCol]! : ''
        } else {
            // Positional detection logic
            if (fields.length >= 3) {
                if (KNOWN_BARCODE_TYPE_VALUES.includes(fields[0]!.toLowerCase())) {
                    type = fields[0]!
                    value = fields[1]!
                    category = fields[2]!
                } else if (KNOWN_BARCODE_TYPE_VALUES.includes(fields[1]!.toLowerCase())) {
                    value = fields[0]!
                    type = fields[1]!
                    category = fields[2]!
                } else {
                    value = fields[0]!
                    type = fields[1]!
                    category = fields[2]!
                }
            } else if (fields.length === 2) {
                if (KNOWN_BARCODE_TYPE_VALUES.includes(fields[0]!.toLowerCase())) {
                    type = fields[0]!
                    value = fields[1]!
                } else if (KNOWN_BARCODE_TYPE_VALUES.includes(fields[1]!.toLowerCase())) {
                    value = fields[0]!
                    type = fields[1]!
                } else {
                    value = fields[0]!
                    type = fields[1]!
                }
            } else if (fields.length === 1) {
                if (KNOWN_BARCODE_TYPE_VALUES.includes(fields[0]!.toLowerCase())) {
                    type = fields[0]!
                    value = ''
                } else {
                    value = fields[0]!
                    type = ''
                }
            }
        }

        // Validate required fields
        if (!type) {
            errors.push(`Row ${lineNumber}: Code type (bcid) is required`)
        }
        if (!value) {
            errors.push(`Row ${lineNumber}: Value is required`)
        }

        if (type && value) {
            const validationError = getValidationError(type, value)
            if (validationError) {
                errors.push(`Row ${lineNumber}: ${validationError}`)
            }
        }

        parsedRows.push({
            lineNumber,
            type,
            value,
            tagNames: splitTagCell(category),
        })
    }

    // If there are any non-duplicate validation errors, return immediately without importing
    if (errors.length > 0) {
        return {
            errors,
            validRowsToImport: [],
            skippedDuplicatesCount: 0,
        }
    }

    // Deduplication logic against existing DB records and within CSV rows
    const tagNameById = new Map<string, string>()
    for (const c of existingCategories) {
        tagNameById.set(c.id, c.name)
    }

    const seenKeys = new Set<string>()
    for (const b of existingBarcodes) {
        const tagNames = b.tags.map((id) => tagNameById.get(id)).filter((n): n is string => !!n)
        const key = `${b.type.toLowerCase()}|||${b.value}|||${tagSetKey(tagNames)}`
        seenKeys.add(key)
    }

    const validRowsToImport: Array<{ type: string; value: string; tagNames: string[] }> = []
    let skippedDuplicatesCount = 0

    for (const row of parsedRows) {
        const key = `${row.type.toLowerCase()}|||${row.value}|||${tagSetKey(row.tagNames)}`
        if (seenKeys.has(key)) {
            skippedDuplicatesCount++
        } else {
            seenKeys.add(key)
            validRowsToImport.push({
                type: row.type,
                value: row.value,
                tagNames: row.tagNames,
            })
        }
    }

    return {
        errors: [],
        validRowsToImport,
        skippedDuplicatesCount,
    }
}

/**
 * Inserts valid barcode rows and auto-created tags into IndexedDB.
 */
export const executeImport = async (
    validRows: Array<{ type: string; value: string; tagNames: string[] }>,
    existingCategories: Category[],
): Promise<{ importedCount: number; newCategoriesCount: number }> => {
    if (validRows.length === 0) {
        return { importedCount: 0, newCategoriesCount: 0 }
    }

    const known = new Map<string, Category>()
    for (const c of existingCategories) {
        known.set(tagKey(c.name), c)
    }

    const created: Category[] = []
    const barcodesToAdd: Barcode[] = validRows.map((row) => ({
        id: uuidv4(),
        type: row.type,
        value: row.value,
        tags: resolveTagIds(row.tagNames, known, created),
        createdAt: Date.now(),
    }))

    if (created.length > 0) {
        await db.categories.bulkAdd(created)
    }

    if (barcodesToAdd.length > 0) {
        await db.barcodes.bulkAdd(barcodesToAdd)
    }

    return {
        importedCount: barcodesToAdd.length,
        newCategoriesCount: created.length,
    }
}
