import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import TagModal from '../src/components/TagModal.vue'
import type { Tag } from '../src/db'

describe('TagModal.vue', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    const sampleTags: Tag[] = [
        { id: 'tag-1', name: 'Work' },
        { id: 'tag-2', name: 'Personal' },
    ]

    it('renders tag list when visible', async () => {
        mount(TagModal, {
            attachTo: document.body,
            props: {
                visible: true,
                tags: sampleTags,
            },
        })

        await nextTick()
        expect(document.body.textContent).toContain('Work')
        expect(document.body.textContent).toContain('Personal')
    })

    it('prompts delete confirmation modal when delete icon is clicked and emits delete on confirm', async () => {
        const wrapper = mount(TagModal, {
            attachTo: document.body,
            props: {
                visible: true,
                tags: sampleTags,
            },
        })

        await nextTick()
        const deleteBtns = document.body.querySelectorAll('button[aria-label="Delete"]')
        expect(deleteBtns.length).toBe(2)

        // Click delete on first tag
        ;(deleteBtns[0] as HTMLButtonElement).click()
        await nextTick()

        // Confirmation modal title should be in body
        expect(document.body.textContent).toContain('Delete tag?')

        // Click confirm in DeleteConfirmModal
        const confirmBtn = document.body.querySelector('.confirm-btn') as HTMLButtonElement
        expect(confirmBtn).not.toBeNull()
        confirmBtn.click()
        await nextTick()

        expect(wrapper.emitted('delete')).toBeTruthy()
        expect(wrapper.emitted('delete')?.[0]?.[0]).toEqual(sampleTags[0])
    })
})
