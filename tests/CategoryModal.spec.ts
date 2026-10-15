import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import CategoryModal from '../src/components/CategoryModal.vue'
import type { Category } from '../src/db'

describe('CategoryModal.vue', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    const sampleCategories: Category[] = [
        { id: 'cat-1', name: 'Work' },
        { id: 'cat-2', name: 'Personal' },
    ]

    it('renders category list when visible', async () => {
        mount(CategoryModal, {
            attachTo: document.body,
            props: {
                visible: true,
                categories: sampleCategories,
            },
        })

        await nextTick()
        expect(document.body.textContent).toContain('Work')
        expect(document.body.textContent).toContain('Personal')
    })

    it('prompts delete confirmation modal when delete icon is clicked and emits delete on confirm', async () => {
        const wrapper = mount(CategoryModal, {
            attachTo: document.body,
            props: {
                visible: true,
                categories: sampleCategories,
            },
        })

        await nextTick()
        const deleteBtns = document.body.querySelectorAll('button[aria-label="Delete"]')
        expect(deleteBtns.length).toBe(2)

        // Click delete on first category
        ;(deleteBtns[0] as HTMLButtonElement).click()
        await nextTick()

        // Confirmation modal title should be in body
        expect(document.body.textContent).toContain('Delete category?')

        // Click confirm in DeleteConfirmModal
        const confirmBtn = document.body.querySelector('.confirm-btn') as HTMLButtonElement
        expect(confirmBtn).not.toBeNull()
        confirmBtn.click()
        await nextTick()

        expect(wrapper.emitted('delete')).toBeTruthy()
        expect(wrapper.emitted('delete')?.[0]?.[0]).toEqual(sampleCategories[0])
    })
})
