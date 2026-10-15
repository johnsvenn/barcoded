import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import App from '../src/App.vue';
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
