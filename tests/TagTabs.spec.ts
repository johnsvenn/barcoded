import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import TagTabs from '../src/components/TagTabs.vue';
import type { Tag } from '../src/db';
import { setupUI } from '../src/setupUI';

describe('TagTabs.vue', () => {
  const tags: Tag[] = [
    { id: 'tag-1', name: 'Work' },
    { id: 'tag-2', name: 'Personal' },
  ];

  it('renders tag tab list including All option', () => {
    const wrapper = mount(TagTabs, {
      global: {
        plugins: [{ install: setupUI }],
      },
      props: {
        tags,
        modelValue: 'all',
      },
    });

    expect(wrapper.text()).toContain('All');
    expect(wrapper.text()).toContain('Work');
    expect(wrapper.text()).toContain('Personal');
  });
});
