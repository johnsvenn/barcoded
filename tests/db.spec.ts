import { describe, it, expect, beforeEach } from 'vitest';
import Dexie from 'dexie';
import { BarcodeDatabase, type Category, type Barcode } from '../src/db';

describe('BarcodeDatabase (IndexedDB integration)', () => {
  let testDb: BarcodeDatabase;

  beforeEach(async () => {
    testDb = new BarcodeDatabase();
    await testDb.categories.clear();
    await testDb.barcodes.clear();
  });

  it('stores and retrieves tags and barcodes correctly', async () => {
    const cat: Category = { id: 'c1', name: 'Work' };
    await testDb.categories.add(cat);

    const retrievedCats = await testDb.categories.toArray();
    expect(retrievedCats).toHaveLength(1);
    expect(retrievedCats[0]?.name).toBe('Work');

    const barcode: Barcode = {
      id: 'b1',
      type: 'qrcode',
      value: 'TEST',
      tags: ['c1'],
      createdAt: 1000,
    };
    await testDb.barcodes.add(barcode);

    const retrievedBarcodes = await testDb.barcodes.where('tags').equals('c1').toArray();
    expect(retrievedBarcodes).toHaveLength(1);
    expect(retrievedBarcodes[0]?.value).toBe('TEST');
  });

  it('finds a barcode by each of its tags', async () => {
    await testDb.barcodes.add({
      id: 'b1',
      type: 'qrcode',
      value: 'TEST',
      tags: ['c1', 'c2'],
      createdAt: 1000,
    });

    expect(await testDb.barcodes.where('tags').equals('c1').count()).toBe(1);
    expect(await testDb.barcodes.where('tags').equals('c2').count()).toBe(1);
  });

  it('stores barcodes with zero tags', async () => {
    await testDb.barcodes.add({
      id: 'b1',
      type: 'qrcode',
      value: 'TEST',
      tags: [],
      createdAt: 1000,
    });

    const saved = await testDb.barcodes.get('b1');
    expect(saved?.tags).toEqual([]);
  });

  it('deletes barcode by id', async () => {
    const barcode: Barcode = {
      id: 'b1',
      type: 'qrcode',
      value: 'TEST',
      tags: ['c1'],
      createdAt: 1000,
    };
    await testDb.barcodes.add(barcode);

    await testDb.barcodes.delete('b1');
    const remaining = await testDb.barcodes.toArray();
    expect(remaining).toHaveLength(0);
  });

  describe('schema v2', () => {
    it('is at version 2 with a multi-entry tags index and no categoryId index', () => {
      expect(testDb.verno).toBe(2);

      const tagsIndex = testDb.barcodes.schema.idxByName['tags'];
      expect(tagsIndex?.multi).toBe(true);
      expect(testDb.barcodes.schema.idxByName['categoryId']).toBeUndefined();
    });

    it('upgrades v1 rows to untagged rows and drops categoryId', async () => {
      await Dexie.delete('BarcodeAppDB');

      const legacy = new Dexie('BarcodeAppDB');
      legacy.version(1).stores({
        categories: 'id, name',
        barcodes: 'id, type, categoryId, createdAt',
      });
      await legacy.table('barcodes').add({
        id: 'old-1',
        type: 'qrcode',
        value: 'LEGACY',
        categoryId: 'c-old',
        createdAt: 500,
      });
      legacy.close();

      const upgraded = new BarcodeDatabase();
      const row = await upgraded.barcodes.get('old-1');
      expect(row?.value).toBe('LEGACY');
      expect(row?.tags).toEqual([]);
      expect(row).not.toHaveProperty('categoryId');
      upgraded.close();
    });
  });
});
