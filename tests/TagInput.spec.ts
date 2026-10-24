import { describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import type { Tag } from '../src/db.ts';
import TagInput from '../src/components/TagInput.vue';

const tags = [
    { id: '1', name: 'Travel' },
    { id: '2', name: 'Tickets' },
    { id: '3', name: 'Work' },
    { id: '4', name: 'Gym' },
] as Tag[];

const createWrapper = (selectedTags: string[] = [], attachTo?: HTMLElement) =>
    mount(TagInput, {
        props: { selectedTags, tags, inputId: 'test-tag-input' },
        attachTo,
    });

type Wrapper = ReturnType<typeof createWrapper>

const optionNames = (wrapper: Wrapper): string[] =>
    wrapper.findAll('[data-test="tag-option"]').map((option) => option.text());

const openMenu = async (wrapper: Wrapper) => {
    await wrapper.find('input').trigger('focus');
};

const type = async (wrapper: Wrapper, value: string) => {
    await wrapper.find('input').setValue(value);
};

const press = async (wrapper: Wrapper, key: string) => {
    await wrapper.find('input').trigger('keydown', { key });
};

describe('TagInput', () => {
    describe('Menu', () => {
        it('Should be closed until the input receives focus', async () => {
            const wrapper = createWrapper();

            expect(wrapper.find('[role="listbox"]').exists()).toBe(false);

            await openMenu(wrapper);

            expect(wrapper.find('[role="listbox"]').exists()).toBe(true);
        });

        it('Should list every unselected tag when focused with an empty query', async () => {
            const wrapper = createWrapper(['Travel']);

            await openMenu(wrapper);

            expect(optionNames(wrapper)).toEqual(['Tickets', 'Work', 'Gym']);
        });

        it('Should keep existing tags listed alongside the create option for a new name', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await type(wrapper, 'Passport');

            expect(wrapper.find('[data-test="create-option"]').text()).toContain('Passport');
        });

        it('Should narrow the existing tags as the user types', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await type(wrapper, 'ti');

            expect(optionNames(wrapper)).toEqual(['Tickets']);
        });

        it('Should rank an exact match before a partial match', async () => {
            const wrapper = mount(TagInput, {
                props: {
                    selectedTags: [],
                    tags: [{ id: '1', name: 'Work trip' }, { id: '2', name: 'Work' }] as Tag[],
                },
            });

            await openMenu(wrapper);
            await type(wrapper, 'work');

            expect(optionNames(wrapper)).toEqual(['Work', 'Work trip']);
        });

        it('Should not offer to create a tag that already exists', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await type(wrapper, 'travel');

            expect(wrapper.find('[data-test="create-option"]').exists()).toBe(false);
        });

        it('Should explain when the query matches a tag that is already selected', async () => {
            const wrapper = createWrapper(['Travel']);

            await openMenu(wrapper);
            await type(wrapper, 'travel');

            expect(wrapper.find('[data-test="empty"]').text()).toContain('already added');
        });

        it('Should close when the input loses focus', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await wrapper.find('input').trigger('blur');

            expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
        });
    });

    describe('Adding tags', () => {
        it('Should emit addTag with the tag name when an existing tag option is clicked', async () => {
            const wrapper = createWrapper(['Travel']);

            await openMenu(wrapper);
            await wrapper.findAll('[data-test="tag-option"]')[0]!.trigger('mousedown');

            expect(wrapper.emitted('addTag')).toEqual([['Tickets']]);
        });

        it('Should clear the query after a tag is added', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await type(wrapper, 'ti');
            await wrapper.find('[data-test="tag-option"]').trigger('mousedown');

            expect((wrapper.find('input').element as HTMLInputElement).value).toBe('');
        });

        it('Should emit addTag for a new tag when Enter is pressed on the create option', async () => {
            const wrapper = createWrapper(['Travel']);

            await openMenu(wrapper);
            await type(wrapper, 'Passport');
            await press(wrapper, 'Enter');

            expect(wrapper.emitted('addTag')).toEqual([['Passport']]);
        });

        it('Should emit addTag for the highlighted existing tag when Enter is pressed', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await type(wrapper, 'wor');
            await press(wrapper, 'Enter');

            expect(wrapper.emitted('addTag')).toEqual([['Work']]);
        });

        it('Should emit exactly what was typed when a comma is pressed', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await type(wrapper, 'Tra');
            await press(wrapper, ',');

            expect(wrapper.emitted('addTag')).toEqual([['Tra']]);
        });

        it('Should emit the casing of an existing tag when the same name is typed', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await type(wrapper, 'travel');
            await press(wrapper, ',');

            expect(wrapper.emitted('addTag')).toEqual([['Travel']]);
        });

        it('Should not emit addTag when the tag is already selected', async () => {
            const wrapper = createWrapper(['Travel']);

            await openMenu(wrapper);
            await type(wrapper, 'TRAVEL');
            await press(wrapper, ',');

            expect(wrapper.emitted('addTag')).toBeUndefined();
        });

        it('Should commit the typed text when Enter is pressed with the menu closed', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await type(wrapper, 'Passport');
            await press(wrapper, 'Escape');
            await press(wrapper, 'Enter');

            expect(wrapper.emitted('addTag')).toEqual([['Passport']]);
        });

        it('Should leave the selected tags untouched until the parent updates them', async () => {
            const wrapper = createWrapper(['Travel']);

            await openMenu(wrapper);
            await wrapper.findAll('[data-test="tag-option"]')[0]!.trigger('mousedown');

            expect(wrapper.findAll('[data-test="chip"]')).toHaveLength(1);

            await wrapper.setProps({ selectedTags: ['Travel', 'Tickets'] });

            expect(wrapper.findAll('[data-test="chip"]')).toHaveLength(2);
        });
    });

    describe('Keyboard navigation', () => {
        it('Should move the highlighted option with the arrow keys', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            expect(wrapper.findAll('[role="option"]')[0]!.attributes('aria-selected')).toBe('true');

            await press(wrapper, 'ArrowDown');
            expect(wrapper.findAll('[role="option"]')[1]!.attributes('aria-selected')).toBe('true');

            await press(wrapper, 'ArrowUp');
            await press(wrapper, 'ArrowUp');
            expect(wrapper.findAll('[role="option"]')[3]!.attributes('aria-selected')).toBe('true');
        });

        it('Should reopen the menu when an arrow key is pressed', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await press(wrapper, 'Escape');
            await press(wrapper, 'ArrowDown');

            expect(wrapper.find('[role="listbox"]').exists()).toBe(true);
        });

        it('Should stop Escape from bubbling only while the menu is open', async () => {
            const wrapper = createWrapper([], document.body);
            const onKeydown = vi.fn();
            document.body.addEventListener('keydown', onKeydown);

            await openMenu(wrapper);
            await press(wrapper, 'Escape');

            expect(wrapper.find('[role="listbox"]').exists()).toBe(false);
            expect(onKeydown).not.toHaveBeenCalled();

            await press(wrapper, 'Escape');

            expect(onKeydown).toHaveBeenCalledTimes(1);

            document.body.removeEventListener('keydown', onKeydown);
            wrapper.unmount();
        });
    });

    describe('Removing tags', () => {
        it('Should emit removeTag when a remove button is clicked', async () => {
            const wrapper = createWrapper(['Travel', 'Work']);

            await wrapper.findAll('[data-test="remove-tag"]')[0]!.trigger('click');

            expect(wrapper.emitted('removeTag')).toEqual([['Travel']]);
        });

        it('Should emit removeTag for the last tag when Backspace is pressed on an empty input', async () => {
            const wrapper = createWrapper(['Travel', 'Work']);

            await press(wrapper, 'Backspace');

            expect(wrapper.emitted('removeTag')).toEqual([['Work']]);
        });

        it('Should not emit removeTag when Backspace is pressed with text in the input', async () => {
            const wrapper = createWrapper(['Travel']);

            await type(wrapper, 'ab');
            await press(wrapper, 'Backspace');

            expect(wrapper.emitted('removeTag')).toBeUndefined();
        });

        it('Should not emit removeTag when Backspace is pressed and nothing is selected', async () => {
            const wrapper = createWrapper();

            await press(wrapper, 'Backspace');

            expect(wrapper.emitted('removeTag')).toBeUndefined();
        });
    });

    describe('Selected tags', () => {
        it('Should render a chip for each selected tag', () => {
            const wrapper = createWrapper(['Travel', 'Work']);

            expect(wrapper.findAll('[data-test="chip"]')).toHaveLength(2);
        });

        it('Should flag tags that do not exist yet with a New badge', () => {
            const wrapper = createWrapper(['Travel', 'Passport']);

            const badges = wrapper.findAll('[data-test="new-badge"]');

            expect(badges).toHaveLength(1);
            expect(wrapper.findAll('[data-test="chip"]')[1]!.text()).toContain('Passport');
        });
    });

    describe('Accessibility', () => {
        it('Should use the supplied input id so that a parent label can point at it', () => {
            const wrapper = createWrapper();

            expect(wrapper.find('input').attributes('id')).toBe('test-tag-input');
        });

        it('Should point aria-activedescendant at the highlighted option', async () => {
            const wrapper = createWrapper();

            await openMenu(wrapper);
            await press(wrapper, 'ArrowDown');

            expect(wrapper.find('input').attributes('aria-activedescendant')).toBe(
                'test-tag-input-listbox-option-1',
            );
        });
    });
});
