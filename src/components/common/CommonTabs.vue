<script setup lang="ts" generic="T extends string">
import type { Component } from "vue";

interface TabOption<T> {
  value: T;
  label: string;
  icon?: Component;
}

withDefaults(
  defineProps<{
    options: ReadonlyArray<TabOption<T>>;
    ariaLabel: string;
    compact?: boolean;
  }>(),
  {
    compact: false,
  },
);

const model = defineModel<T>({ required: true });
</script>

<template>
  <div
    :aria-label="ariaLabel"
    class="grid gap-1 rounded-full border border-white/15 bg-[#202d54]/55 p-1 shadow-inner backdrop-blur-md"
    :style="{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }"
  >
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="flex items-center justify-center whitespace-nowrap rounded-full font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 active:scale-[0.98]"
      :class="[
        compact ? 'px-2 py-2 text-[10px] sm:px-3 sm:text-xs' : 'gap-2 px-3 py-2 text-xs',
        model === option.value
          ? 'bg-cyan-200 text-[#17213f] shadow-md'
          : 'text-white/70 hover:bg-white/10 hover:text-white',
      ]"
      :aria-pressed="model === option.value"
      @click="model = option.value"
    >
      <component
        :is="option.icon"
        v-if="option.icon"
        class="h-4 w-4"
        :stroke-width="2"
      />
      {{ option.label }}
    </button>
  </div>
</template>
