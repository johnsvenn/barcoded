import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import BarcodeCard from '../src/components/BarcodeCard.vue';
import type { Barcode } from '../src/db';

// Mock bwip-js to avoid canvas rendering errors in headless node environment
vi.mock('bwip-js', () => ({
  default: {
    toCanvas: vi.fn(),
  },
}));

describe('BarcodeCard.vue', () => {
  const sampleBarcode: Barcode = {
    id: 'test-1',
    type: 'qrcode',
    value: 'HELLO-WORLD',
    categoryId: 'cat-1',
    createdAt: 1000,
  };

  it('renders barcode value and type label', () => {
    const wrapper = mount(BarcodeCard, {
      props: {
        barcode: sampleBarcode,
        typeLabel: 'QR Code',
        typeBcid: 'qrcode',
      },
    });

    expect(wrapper.text()).toContain('HELLO-WORLD');
    expect(wrapper.text()).toContain('QR Code');
    expect(wrapper.find('canvas').exists()).toBe(true);
  });

  it('emits delete event when delete button is clicked', async () => {
    const wrapper = mount(BarcodeCard, {
      props: {
        barcode: sampleBarcode,
        typeLabel: 'QR Code',
        typeBcid: 'qrcode',
      },
    });

    const deleteBtn = wrapper.find('.delete-btn');
    expect(deleteBtn.exists()).toBe(true);
    await deleteBtn.trigger('click');

    const emitted = wrapper.emitted('delete');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[1]).toBe('test-1');
  });

  it('emits edit event when edit button is clicked', async () => {
    const wrapper = mount(BarcodeCard, {
      props: {
        barcode: sampleBarcode,
        typeLabel: 'QR Code',
        typeBcid: 'qrcode',
      },
    });

    const editBtn = wrapper.find('.edit-btn');
    expect(editBtn.exists()).toBe(true);
    await editBtn.trigger('click');

    const emitted = wrapper.emitted('edit');
    expect(emitted).toBeTruthy();
    expect(emitted?.[0]?.[0]).toEqual(sampleBarcode);
  });
});
