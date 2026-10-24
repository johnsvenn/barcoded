import { describe, expect, it, vi } from 'vitest';
import App from '../src/App.vue';
import { mount } from '@vue/test-utils';
import { setupUI } from '../src/setupUI';

vi.mock('bwip-js', () => ({
  default: {
    toCanvas: vi.fn<() => void>(),
  },
}));

describe('App.vue', () => {
  it('mounts properly and renders header title', () => {
    const wrapper = mount(App, {
      global: {
        plugins: [{ install: setupUI }],
      },
    });

    expect(wrapper.text()).toContain('Barcoded');
  });
});
