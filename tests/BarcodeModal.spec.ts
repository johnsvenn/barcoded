import type { Barcode, Tag } from '../src/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { mount, type VueWrapper } from '@vue/test-utils';
import BarcodeModal from '../src/components/BarcodeModal.vue';
import { nextTick } from 'vue';
import { setupUI } from '../src/setupUI';

describe('BarcodeModal.vue', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  const types = [
    { label: 'QR Code', value: 'qrcode', bcid: 'qrcode' },
    { label: 'EAN-13', value: 'ean13', bcid: 'ean13' },
  ];

  const tags: Tag[] = [
    { id: 'tag-1', name: 'Work' },
    { id: 'tag-2', name: 'Personal' },
  ];

  const sampleBarcode: Barcode = {
    id: 'b-1',
    type: 'ean13',
    value: '4006381333931',
    tags: ['tag-2'],
    createdAt: 100,
  };

  const mountModal = (props: Partial<InstanceType<typeof BarcodeModal>['$props']> = {}) =>
    mount(BarcodeModal, {
      attachTo: document.body,
      global: {
        plugins: [{ install: setupUI }],
      },
      props: {
        visible: true,
        editingBarcode: null,
        types,
        tags,
        initialTagId: '',
        defaultType: 'qrcode',
        ...props,
      },
    });

  const tagInput = () => document.querySelector('#modal-tag-input') as HTMLInputElement;

  const chipNames = () =>
    Array.from(document.querySelectorAll('[aria-label^="Remove tag "]')).map((b) =>
      b.getAttribute('aria-label')!.replace('Remove tag ', ''),
    );

  const typeTag = async (text: string) => {
    tagInput().value = text;
    tagInput().dispatchEvent(new Event('input'));
    await nextTick();
  };

  const pressEnterInTagInput = async () => {
    tagInput().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await nextTick();
  };

  const clickButtonWithText = async (text: string) => {
    const btn = Array.from(document.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === text,
    ) as HTMLButtonElement | undefined;
    expect(btn, `button "${text}"`).toBeDefined();
    btn!.click();
    await nextTick();
  };

  const fillValue = async (value: string) => {
    const input = document.querySelector('#modal-value') as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    await nextTick();
  };

  const savedPayload = (wrapper: VueWrapper) =>
    wrapper.emitted('save')?.[0]?.[0] as { type: string; value: string; tags: string[] };

  it('renders Create Barcode title when editingBarcode is null', async () => {
    mountModal({ initialTagId: 'tag-1' });

    await nextTick();
    expect(document.body.textContent).toContain('Create Barcode');
  });

  it('renders Edit Barcode title when editingBarcode is provided', async () => {
    mountModal({ editingBarcode: sampleBarcode, initialTagId: 'tag-1' });

    await nextTick();
    expect(document.body.textContent).toContain('Edit Barcode');
  });

  it('pre-selects the active tab tag for a new barcode', async () => {
    mountModal({ initialTagId: 'tag-1' });
    await nextTick();

    expect(chipNames()).toEqual(['Work']);
  });

  it('starts a new barcode with no tags when no tag is active', async () => {
    mountModal({ initialTagId: '' });
    await nextTick();

    expect(chipNames()).toEqual([]);
  });

  it('shows the barcode’s own tags when editing', async () => {
    mountModal({ editingBarcode: sampleBarcode });
    await nextTick();

    expect(chipNames()).toEqual(['Personal']);
  });

  it('creates a new tag on Enter and emits it with the save payload', async () => {
    const wrapper = mountModal();
    await nextTick();

    await typeTag('Shopping');
    await pressEnterInTagInput();
    await typeTag('  Errands  ');
    await pressEnterInTagInput();
    await fillValue('HELLO');
    await clickButtonWithText('Create');

    expect(chipNames()).toEqual(['Shopping', 'Errands']);
    expect(savedPayload(wrapper)).toEqual({ type: 'qrcode', value: 'HELLO', tags: ['Shopping', 'Errands'], note: '' });
  });

  it('matches an existing tag case-insensitively instead of creating a duplicate', async () => {
    mountModal();
    await nextTick();

    await typeTag('personal');
    await pressEnterInTagInput();

    expect(chipNames()).toEqual(['Personal']);
  });

  it('offers no create option for a name that already exists', async () => {
    mountModal();
    await nextTick();

    await typeTag('WORK');
    expect(document.querySelector('[data-test="create-option"]')).toBeNull();
  });

  it('allows saving with zero tags', async () => {
    const wrapper = mountModal({ initialTagId: 'tag-1' });
    await nextTick();

    (document.querySelector('[aria-label="Remove tag Work"]') as HTMLButtonElement).click();
    await nextTick();
    await fillValue('HELLO');
    await clickButtonWithText('Create');

    expect(savedPayload(wrapper).tags).toEqual([]);
  });
});
