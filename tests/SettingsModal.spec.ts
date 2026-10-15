import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import SettingsModal from '../src/components/SettingsModal.vue'
import { BarcodeDatabase } from '../src/db'
import { setupUI } from '../src/setupUI'

describe('SettingsModal.vue', () => {
    let testDb: BarcodeDatabase

    beforeEach(async () => {
        document.body.innerHTML = ''
        testDb = new BarcodeDatabase()
        await testDb.categories.clear()
        await testDb.barcodes.clear()
    });

    it('renders Settings title when visible is true', async () => {
        mount(SettingsModal, {
            attachTo: document.body,
            global: {
                plugins: [{ install: setupUI }],
            },
            props: {
                visible: true,
            },
        });

        await nextTick();
        expect(document.body.textContent).toContain('Settings');
        expect(document.body.textContent).toContain('Import Barcodes (CSV)');
    });

    it('does not render modal content when visible is false', async () => {
        mount(SettingsModal, {
            attachTo: document.body,
            global: {
                plugins: [{ install: setupUI }],
            },
            props: {
                visible: false,
            },
        });

        await nextTick();
        expect(document.body.textContent).not.toContain('Settings');
    });

    it('shows validation errors when invalid CSV file is selected and imported', async () => {
        mount(SettingsModal, {
            attachTo: document.body,
            global: {
                plugins: [{ install: setupUI }],
            },
            props: {
                visible: true,
            },
        });

        await nextTick();

        // Create a fake invalid CSV File (ean13 with value 100)
        const file = new File(['100, ean13'], 'invalid.csv', { type: 'text/csv' })

        // Find file input in document.body (due to Teleport)
        const fileInputEl = document.querySelector('input[type="file"]') as HTMLInputElement
        expect(fileInputEl).toBeTruthy()

        Object.defineProperty(fileInputEl, 'files', {
            value: [file],
            writable: false,
        });

        fileInputEl.dispatchEvent(new Event('change', { bubbles: true }))
        await nextTick()

        // Find Upload & Import button in document.body
        const buttons = Array.from(document.querySelectorAll('button'))
        const uploadBtn = buttons.find((btn) => btn.textContent?.includes('Upload & Import'))
        expect(uploadBtn).toBeTruthy()
        expect(uploadBtn?.disabled).toBe(false)

        uploadBtn?.click()
        await nextTick()
        // Wait for async file reading / db calls
        await new Promise((resolve) => setTimeout(resolve, 50))
        await nextTick()

        expect(document.body.textContent).toContain('Cannot import file')
        expect(document.body.textContent).toContain('EAN-13 requires exactly 12 or 13 numeric digits')
    });

    it('successfully imports valid CSV file and emits imported event', async () => {
        const wrapper = mount(SettingsModal, {
            attachTo: document.body,
            global: {
                plugins: [{ install: setupUI }],
            },
            props: {
                visible: true,
            },
        });

        await nextTick();

        // Create a valid CSV file
        const file = new File(['123456, qrcode, Work'], 'valid.csv', { type: 'text/csv' })

        const fileInputEl = document.querySelector('input[type="file"]') as HTMLInputElement
        expect(fileInputEl).toBeTruthy()

        Object.defineProperty(fileInputEl, 'files', {
            value: [file],
            writable: false,
        });

        fileInputEl.dispatchEvent(new Event('change', { bubbles: true }))
        await nextTick()

        const buttons = Array.from(document.querySelectorAll('button'))
        const uploadBtn = buttons.find((btn) => btn.textContent?.includes('Upload & Import'))
        expect(uploadBtn).toBeTruthy()

        uploadBtn?.click()
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 50))
        await nextTick()

        expect(document.body.textContent).toContain('Successfully imported 1 barcodes')
        expect(wrapper.emitted('imported')).toBeTruthy()
    });
});
