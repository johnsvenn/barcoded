import { describe, it, expect, beforeEach } from 'vitest';
import { BarcodeDatabase, type Category, type Barcode } from '../src/db';

describe('BarcodeDatabase (IndexedDB integration)', () => {
  let testDb: BarcodeDatabase;

  beforeEach(async () => {
    testDb = new BarcodeDatabase();
    await testDb.categories.clear();
    await testDb.barcodes.clear();
  });

  it('stores and retrieves categories and barcodes correctly', async () => {
    const cat: Category = { id: 'c1', name: 'Work' };
    await testDb.categories.add(cat);

    const retrievedCats = await testDb.categories.toArray();
    expect(retrievedCats).toHaveLength(1);
    expect(retrievedCats[0]?.name).toBe('Work');

    const barcode: Barcode = {
      id: 'b1',
      type: 'qrcode',
      value: 'TEST',
      categoryId: 'c1',
      createdAt: 1000,
    };
    await testDb.barcodes.add(barcode);

    const retrievedBarcodes = await testDb.barcodes.where('categoryId').equals('c1').toArray();
    expect(retrievedBarcodes).toHaveLength(1);
    expect(retrievedBarcodes[0]?.value).toBe('TEST');
  });

  it('deletes barcode by id', async () => {
    const barcode: Barcode = {
      id: 'b1',
      type: 'qrcode',
      value: 'TEST',
      categoryId: 'c1',
      createdAt: 1000,
    };
    await testDb.barcodes.add(barcode);

    await testDb.barcodes.delete('b1');
    const remaining = await testDb.barcodes.toArray();
    expect(remaining).toHaveLength(0);
  });
});
