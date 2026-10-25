import { beforeEach, describe, expect, it } from 'vitest';
import { db, type Tag } from '../src/db';
import { deleteTag, resolveTagIds, tagKey } from '../src/utils/tags';

describe('tags utility', () => {
    describe('tagKey', () => {
        it('trims and lowercases', () => {
            expect(tagKey('  Shopping ')).toBe('shopping');
        });

        it('collapses runs of spaces into one', () => {
            expect(tagKey('Going   to  Gym')).toBe('going to gym');
        });
    });

    describe('resolveTagIds', () => {
        it('reuses an existing tag when the name matches case-insensitively', () => {
            const known = new Map<string, Tag>([['work', { id: 'c1', name: 'Work' }]]);
            const created: Tag[] = [];

            expect(resolveTagIds(['WORK'], known, created)).toEqual(['c1']);
            expect(created).toEqual([]);
        });

        it('creates a trimmed, lowercase tag for an unknown name and remembers it', () => {
            const known = new Map<string, Tag>();
            const created: Tag[] = [];

            const ids = resolveTagIds(['  Gym  ', 'gym'], known, created);

            expect(created).toHaveLength(1);
            expect(created[0]?.name).toBe('gym');
            expect(ids).toEqual([created[0]!.id]);
        });
    });

    describe('deleteTag', () => {
        beforeEach(async () => {
            await db.tags.clear();
            await db.barcodes.clear();
        });

        it('removes the tag from every barcode that has it and keeps the barcodes', async () => {
            await db.tags.bulkAdd([
                { id: 'keep', name: 'Keep' },
                { id: 'gone', name: 'Gone' },
            ]);
            await db.barcodes.bulkAdd([
                { id: 'b1', type: 'qrcode', value: 'A', tags: ['gone'], createdAt: 1 },
                { id: 'b2', type: 'qrcode', value: 'B', tags: ['gone', 'keep'], createdAt: 2 },
                { id: 'b3', type: 'qrcode', value: 'C', tags: ['keep'], createdAt: 3 },
            ]);

            await deleteTag('gone');

            expect(await db.tags.get('gone')).toBeUndefined();
            expect((await db.barcodes.get('b1'))?.tags).toEqual([]);
            expect((await db.barcodes.get('b2'))?.tags).toEqual(['keep']);
            expect((await db.barcodes.get('b3'))?.tags).toEqual(['keep']);
            expect(await db.barcodes.count()).toBe(3);
        });
    });
});
