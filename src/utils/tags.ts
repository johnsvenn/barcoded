import { v4 as uuidv4 } from 'uuid'
import { db, type Category } from '../db'

/**
 * Lookup key for a tag name. Names are trimmed and compared case-insensitively.
 */
export const tagKey = (name: string): string => name.trim().toLowerCase()

/**
 * Maps tag names to tag ids. A name matching a known tag reuses it; any other
 * name creates a new tag, which is added to `known` and `created` so later
 * names in the same batch reuse it too.
 */
export const resolveTagIds = (
    names: string[],
    known: Map<string, Category>,
    created: Category[],
): string[] => {
    const ids = names.map((name) => {
        const key = tagKey(name)
        let tag = known.get(key)
        if (!tag) {
            tag = { id: uuidv4(), name: name.trim() }
            known.set(key, tag)
            created.push(tag)
        }
        return tag.id
    })

    return [...new Set(ids)]
}

/**
 * Deletes a tag and removes it from every barcode that has it. The barcodes stay.
 */
export const deleteTag = async (tagId: string): Promise<void> => {
    await db.transaction('rw', db.categories, db.barcodes, async () => {
        await db.categories.delete(tagId)
        await db.barcodes
            .where('tags')
            .equals(tagId)
            .modify((b) => {
                b.tags = b.tags.filter((id) => id !== tagId)
            })
    })
}
