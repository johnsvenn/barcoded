import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import BarcodeModal from '../src/components/BarcodeModal.vue';
import type { Barcode, Category } from '../src/db';
import { setupUI } from '../src/setupUI';

describe('BarcodeModal.vue', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  const types = [
    { label: 'QR Code', value: 'qrcode', bcid: 'qrcode' },
    { label: 'EAN-13', value: 'ean13', bcid: 'ean13' },
  ];

  const categories: Category[] = [
    { id: 'cat-1', name: 'Work' },
    { id: 'cat-2', name: 'Personal' },
  ];

  const sampleBarcode: Barcode = {
    id: 'b-1',
    type: 'ean13',
    value: '4006381333931',
    categoryId: 'cat-2',
    createdAt: 100,
  };

  it('renders Create Barcode title when editingBarcode is null', async () => {
    mount(BarcodeModal, {
      attachTo: document.body,
      global: {
        plugins: [{ install: setupUI }],
      },
      props: {
        visible: true,
        editingBarcode: null,
        types,
        categories,
        initialCategoryId: 'cat-1',
      },
    });

    await nextTick();
    expect(document.body.textContent).toContain('Create Barcode');
  });

  it('renders Edit Barcode title when editingBarcode is provided', async () => {
    mount(BarcodeModal, {
      attachTo: document.body,
      global: {
        plugins: [{ install: setupUI }],
      },
      props: {
        visible: true,
        editingBarcode: sampleBarcode,
        types,
        categories,
        initialCategoryId: 'cat-1',
      },
    });

    await nextTick();
    expect(document.body.textContent).toContain('Edit Barcode');
  });
});
