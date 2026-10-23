import Dexie, { type Table } from 'dexie'

export interface Category {
    id: string
    name: string
}

export interface Barcode {
    id: string
    type: string
    value: string
    tags: string[]
    createdAt: number
}

interface LegacyBarcode extends Omit<Barcode, 'tags'> {
    tags?: string[]
    categoryId?: string
}

export class BarcodeDatabase extends Dexie {
    categories!: Table<Category, string>
    barcodes!: Table<Barcode, string>

    constructor() {
        super('BarcodeAppDB')
        this.version(1).stores({
            categories: 'id, name',
            barcodes: 'id, type, categoryId, createdAt',
        })
        this.version(2)
            .stores({
                barcodes: 'id, type, *tags, createdAt',
            })
            .upgrade((tx) =>
                tx
                    .table<LegacyBarcode>('barcodes')
                    .toCollection()
                    .modify((b) => {
                        b.tags = []
                        delete b.categoryId
                    }),
            )
    }
}

export const db = new BarcodeDatabase()
