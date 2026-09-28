import Dexie, { type Table } from 'dexie';

export interface Category {
  id: string;
  name: string;
}

export interface Barcode {
  id: string;
  type: string;
  value: string;
  categoryId: string;
  createdAt: number;
}

export class BarcodeDatabase extends Dexie {
  categories!: Table<Category, string>;
  barcodes!: Table<Barcode, string>;

  constructor() {
    super('BarcodeAppDB');
    this.version(1).stores({
      categories: 'id, name',
      barcodes: 'id, type, categoryId, createdAt'
    });
  }
}

export const db = new BarcodeDatabase();
