import { type Barcode, BarcodeDatabase, type Tag } from '../src/db';
import { beforeEach, describe, expect, it } from 'vitest';
import Dexie from 'dexie';

describe('BarcodeDatabase (IndexedDB integration)', () => {
  let testDb: BarcodeDatabase;

  beforeEach(async () => {
    testDb = new BarcodeDatabase();
    await testDb.tags.clear();
    await testDb.barcodes.clear();
  });

  it('stores and retrieves tags and barcodes correctly', async () => {
    const tag: Tag = { id: 'c1', name: 'Work' };
    await testDb.tags.add(tag);

    const retrievedTags = await testDb.tags.toArray();
    expect(retrievedTags).toHaveLength(1);
    expect(retrievedTags[0]?.name).toBe('Work');

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

  describe('schema', () => {
    it('is at version 3 with a multi-entry tags index and no categoryId index', () => {
      expect(testDb.verno).toBe(3);

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

    it('moves v2 categories into the tags table', async () => {
      await Dexie.delete('BarcodeAppDB');

      const legacy = new Dexie('BarcodeAppDB');
      legacy.version(2).stores({
        categories: 'id, name',
        barcodes: 'id, type, *tags, createdAt',
      });
      await legacy.table('categories').add({ id: 'c1', name: 'work' });
      legacy.close();

      const upgraded = new BarcodeDatabase();
      expect(await upgraded.tags.toArray()).toEqual([{ id: 'c1', name: 'work' }]);
      upgraded.close();
    });
  });
});
