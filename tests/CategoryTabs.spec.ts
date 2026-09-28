import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CategoryTabs from '../src/components/CategoryTabs.vue';
import type { Category } from '../src/db';
import { setupUI } from '../src/setupUI';

describe('CategoryTabs.vue', () => {
  const categories: Category[] = [
    { id: 'cat-1', name: 'Work' },
    { id: 'cat-2', name: 'Personal' },
  ];

  it('renders category tab list including All option', () => {
    const wrapper = mount(CategoryTabs, {
      global: {
        plugins: [{ install: setupUI }],
      },
      props: {
        categories,
        modelValue: 'all',
      },
    });

    expect(wrapper.text()).toContain('All');
    expect(wrapper.text()).toContain('Work');
    expect(wrapper.text()).toContain('Personal');
  });
});
