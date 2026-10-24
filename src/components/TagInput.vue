<script lang="ts">
import { defineComponent, nextTick, type PropType } from 'vue';
import { PlusIcon, XMarkIcon } from '@heroicons/vue/24/outline';
import type { Tag } from '../db';
import { tagKey } from '../utils/tags';

interface TagOption {
    kind: 'existing' | 'create'
    name: string
}

export default defineComponent({
    name: 'TagInput',

    components: { PlusIcon, XMarkIcon },

    props: {
        // The names of the tags that are currently selected. Owned by the parent.
        selectedTags: {
            type: Array as PropType<string[]>,
            required: true,
        },
        // Every tag that already exists.
        tags: {
            type: Array as PropType<Tag[]>,
            required: true,
        },
        // Lets a parent label point at the input.
        inputId: {
            type: String,
            default: 'tag-input',
        },
        placeholder: {
            type: String,
            default: 'Find or create a tag',
        },
    },

    emits: {
        addTag: (name: string) => typeof name === 'string',
        removeTag: (name: string) => typeof name === 'string',
    },

    data() {
        return {
            query: '',
            isOpen: false,
            activeIndex: 0,
        };
    },

    computed: {
        trimmedQuery(): string {
            return this.query.trim();
        },

        listboxId(): string {
            return `${this.inputId}-listbox`;
        },

        // Unselected tags that match the query, best matches first, followed by a create option when needed.
        options(): TagOption[] {
            const query = tagKey(this.trimmedQuery);

            // Exact matches rank first, then prefix matches, then partial matches. A negative rank is no match.
            const rank = (name: string): number => {
                const key = tagKey(name);
                if (!query) return 1;
                if (key === query) return 0;
                if (key.startsWith(query)) return 1;
                if (key.includes(query)) return 2;
                return -1;
            };

            const existing = this.tags
                .filter((tag) => !this.isSelected(tag.name) && rank(tag.name) >= 0)
                .sort((a, b) => rank(a.name) - rank(b.name))
                .map((tag): TagOption => ({ kind: 'existing', name: tag.name }));

            const canCreate =
                !!this.trimmedQuery &&
                !this.existingTagFor(this.trimmedQuery) &&
                !this.isSelected(this.trimmedQuery);

            return canCreate ? [...existing, { kind: 'create', name: this.trimmedQuery }] : existing;
        },

        activeOptionId(): string | undefined {
            return this.options[this.activeIndex]
                ? `${this.listboxId}-option-${this.activeIndex}`
                : undefined;
        },

        emptyMessage(): string {
            if (this.trimmedQuery) return `‘${this.trimmedQuery}’ is already added.`;
            return this.tags.length ? 'Every existing tag is selected.' : 'No tags yet. Type to create one.';
        },
    },

    watch: {
        // Keeps the highlighted row valid when the list shrinks.
        options(newOptions: TagOption[]) {
            if (this.activeIndex >= newOptions.length) {
                this.activeIndex = Math.max(0, newOptions.length - 1);
            }
        },
    },

    methods: {
        isSelected(name: string): boolean {
            return this.selectedTags.some((selected) => tagKey(selected) === tagKey(name));
        },

        existingTagFor(name: string): Tag | undefined {
            return this.tags.find((tag) => tagKey(tag.name) === tagKey(name));
        },

        focus(): void {
            ;(this.$refs.input as HTMLInputElement | undefined)?.focus();
        },

        focusInput(event: MouseEvent): void {
            // Clicks on a remove button should not move focus.
            if ((event.target as HTMLElement).closest('button')) return;
            this.focus();
        },

        openMenu(): void {
            this.isOpen = true;
        },

        closeMenu(): void {
            this.isOpen = false;
        },

        onInput(): void {
            this.isOpen = true;
            this.activeIndex = 0;
        },

        // Asks the parent to add a tag. The parent owns the selection, so nothing is stored here.
        requestAdd(name: string): void {
            const trimmed = name.trim();
            if (!trimmed) return;

            // Reuse the casing of an existing tag so that duplicates are not created.
            const canonical = this.existingTagFor(trimmed)?.name ?? trimmed;
            if (!this.isSelected(canonical)) {
                this.$emit('addTag', canonical);
            }
            this.query = '';
            this.activeIndex = 0;
        },

        requestRemove(name: string): void {
            this.$emit('removeTag', name);
        },

        selectOption(option: TagOption): void {
            this.requestAdd(option.name);
        },

        // Adds exactly what has been typed, even when it only partly matches an existing tag.
        commitQuery(): void {
            this.requestAdd(this.query);
        },

        onEnter(): void {
            const option = this.isOpen ? this.options[this.activeIndex] : undefined;
            if (option) this.selectOption(option);
            else this.commitQuery();
        },

        onEscape(event: KeyboardEvent): void {
            // Only swallow Escape when it closes the menu, so a second press can still close the modal.
            if (!this.isOpen) return;
            event.stopPropagation();
            this.isOpen = false;
        },

        onBackspace(): void {
            const last = this.selectedTags[this.selectedTags.length - 1];
            if (this.query !== '' || last === undefined) return;
            this.requestRemove(last);
        },

        moveActive(step: number): void {
            this.isOpen = true;
            const count = this.options.length;
            if (!count) return;
            this.activeIndex = (this.activeIndex + step + count) % count;
            this.scrollActiveIntoView();
        },

        onKeydown(event: KeyboardEvent): void {
            switch (event.key) {
                case 'ArrowDown':
                    event.preventDefault();
                    this.moveActive(1);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.moveActive(-1);
                    break;
                case 'Enter':
                    event.preventDefault();
                    this.onEnter();
                    break;
                case ',':
                    event.preventDefault();
                    this.commitQuery();
                    break;
                case 'Escape':
                    this.onEscape(event);
                    break;
                case 'Backspace':
                    this.onBackspace();
                    break;
            }
        },

        async scrollActiveIntoView(): Promise<void> {
            await nextTick();
            const listbox = this.$refs.listbox as HTMLElement | undefined;
            const row = listbox?.children[this.activeIndex] as HTMLElement | undefined;
            if (!listbox || !row) return;

            const rowBottom = row.offsetTop + row.offsetHeight;
            if (row.offsetTop < listbox.scrollTop) {
                listbox.scrollTop = row.offsetTop;
            } else if (rowBottom > listbox.scrollTop + listbox.clientHeight) {
                listbox.scrollTop = rowBottom - listbox.clientHeight;
            }
        },

        optionClasses(option: TagOption, isActive: boolean): string[] {
            const isCreate = option.kind === 'create';
            return [
                isCreate ? 'text-green-700' : 'text-slate-700',
                isActive ? (isCreate ? 'bg-green-50' : 'bg-slate-100') : '',
            ];
        },
    },
});
</script>

<template>
    <div class="relative">
        <div class="flex flex-wrap items-center gap-1.5 w-full px-2 py-1.5 border border-slate-300 rounded bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
             @click="focusInput">
            <span v-for="name in selectedTags"
                  :key="name"
                  data-test="chip"
                  class="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded">
                {{ name }}
                <span v-if="!existingTagFor(name)"
                      data-test="new-badge"
                      class="px-1 text-[10px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 border border-green-200 rounded-sm">
                    New
                </span>
                <button type="button"
                        data-test="remove-tag"
                        class="p-0.5 rounded text-blue-600 hover:text-blue-900"
                        :aria-label="`Remove tag ${name}`"
                        @click.stop="requestRemove(name)">
                    <XMarkIcon class="w-3 h-3" />
                </button>
            </span>
            <input :id="inputId"
                   ref="input"
                   v-model="query"
                   type="text"
                   autocomplete="off"
                   role="combobox"
                   aria-autocomplete="list"
                   class="flex-1 min-w-24 py-1 text-sm text-slate-800 bg-transparent focus:outline-none"
                   :placeholder="placeholder"
                   :aria-expanded="isOpen"
                   :aria-controls="listboxId"
                   :aria-activedescendant="isOpen ? activeOptionId : undefined"
                   @focus="openMenu"
                   @click="openMenu"
                   @blur="closeMenu"
                   @input="onInput"
                   @keydown="onKeydown" />
        </div>

        <ul v-if="isOpen"
            :id="listboxId"
            ref="listbox"
            role="listbox"
            aria-label="Tags"
            class="absolute z-20 left-0 right-0 top-full mt-1 max-h-52 overflow-y-auto p-1 bg-white border border-slate-300 rounded shadow-lg">
            <li v-for="(option, index) in options"
                :id="`${listboxId}-option-${index}`"
                :key="`${option.kind}-${option.name}`"
                role="option"
                :aria-selected="index === activeIndex"
                :data-test="option.kind === 'create' ? 'create-option' : 'tag-option'"
                class="flex items-center gap-2 px-2 py-1.5 rounded text-sm cursor-pointer"
                :class="optionClasses(option, index === activeIndex)"
                @mousedown.prevent="selectOption(option)"
                @mousemove="activeIndex = index">
                <template v-if="option.kind === 'create'">
                    <PlusIcon class="w-3.5 h-3.5" />
                    Create ‘{{ option.name }}’
                </template>
                <template v-else>
                    {{ option.name }}
                </template>
            </li>
            <li v-if="options.length === 0"
                data-test="empty"
                class="px-2 py-2 text-sm text-slate-500">
                {{ emptyMessage }}
            </li>
        </ul>
    </div>
</template>
