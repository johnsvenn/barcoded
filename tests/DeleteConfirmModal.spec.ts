import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import DeleteConfirmModal from '../src/components/DeleteConfirmModal.vue'

describe('DeleteConfirmModal.vue', () => {
    beforeEach(() => {
        document.body.innerHTML = ''
    })

    it('renders modal content when visible is true', async () => {
        mount(DeleteConfirmModal, {
            attachTo: document.body,
            props: {
                visible: true,
                title: 'Delete test item?',
                description: 'Custom description text',
            },
        })

        await nextTick()
        expect(document.body.textContent).toContain('Delete test item?')
        expect(document.body.textContent).toContain('Custom description text')
    })

    it('does not render content when visible is false', async () => {
        mount(DeleteConfirmModal, {
            attachTo: document.body,
            props: {
                visible: false,
            },
        })

        await nextTick()
        expect(document.body.querySelector('h3')).toBeNull()
    })

    it('emits confirm and update:visible events when confirm button is clicked', async () => {
        const wrapper = mount(DeleteConfirmModal, {
            attachTo: document.body,
            props: {
                visible: true,
            },
        })

        await nextTick()
        const confirmBtn = document.body.querySelector('.confirm-btn') as HTMLButtonElement
        expect(confirmBtn).not.toBeNull()
        confirmBtn.click()
        await nextTick()

        expect(wrapper.emitted('confirm')).toBeTruthy()
        expect(wrapper.emitted('update:visible')).toEqual([[false]])
    })

    it('emits cancel and update:visible events when cancel button is clicked', async () => {
        const wrapper = mount(DeleteConfirmModal, {
            attachTo: document.body,
            props: {
                visible: true,
            },
        })

        await nextTick()
        const cancelBtn = document.body.querySelector('.cancel-btn') as HTMLButtonElement
        expect(cancelBtn).not.toBeNull()
        cancelBtn.click()
        await nextTick()

        expect(wrapper.emitted('cancel')).toBeTruthy()
        expect(wrapper.emitted('update:visible')).toEqual([[false]])
    })
})
