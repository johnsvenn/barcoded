import { db, type Tag } from '../db';
import { v4 as uuidv4 } from 'uuid';

/**
 * Canonical form of a tag name. Tags are stored trimmed and lowercase.
 */
export const normaliseTagName = (name: string): string => name.trim().toLowerCase();

/**
 * Lookup key for a tag name. Names are compared in their normalised form.
 */
export const tagKey = (name: string): string => normaliseTagName(name);

/**
 * Maps tag names to tag ids. A name matching a known tag reuses it; any other
 * name creates a new tag, which is added to `known` and `created` so later
 * names in the same batch reuse it too.
 */
export const resolveTagIds = (
    names: string[],
    known: Map<string, Tag>,
    created: Tag[],
): string[] => {
    const ids = names.map((name) => {
        const key = tagKey(name);
        let tag = known.get(key);
        if (!tag) {
            tag = { id: uuidv4(), name: key };
            known.set(key, tag);
            created.push(tag);
        }
        return tag.id;
    });

    return [...new Set(ids)];
};

/**
 * Deletes a tag and removes it from every barcode that has it. The barcodes stay.
 */
export const deleteTag = async (tagId: string): Promise<void> => {
    await db.transaction('rw', db.tags, db.barcodes, async () => {
        await db.tags.delete(tagId);
        await db.barcodes
            .where('tags')
            .equals(tagId)
            .modify((b) => {
                b.tags = b.tags.filter((id) => id !== tagId);
            });
    });
};
