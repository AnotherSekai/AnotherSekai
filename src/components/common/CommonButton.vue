<script setup lang="ts">
import { computed } from "vue";
import type { PrimitiveProps } from "reka-ui";
import { Primitive } from "reka-ui";

type ButtonType = "text" | "icon";
type ButtonColor = "white" | "teal" | "gray";
type ButtonSize = "sm" | "md" | "lg";

interface Props extends PrimitiveProps {
  type?: ButtonType;
  color?: ButtonColor;
  size?: ButtonSize;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: "text",
  color: "white",
  size: "md",
  as: "button",
});
const buttonClass = computed(() => {
  const baseClass = "transition-all outline-none flex items-center justify-center text-black";

  // Icon button styles
  if (props.type === "icon") {
    const iconBase =
      "h-10 w-10 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg shadow-black/10";
    if (props.color === "white") {
      return `${baseClass} ${iconBase} bg-white/60 text-primary hover:bg-white/30`;
    }
  }

  // Text button styles
  if (props.type === "text") {
    const textBase = "font-black tracking-widest rounded-full shadow-lg";

    const sizeClass = {
        sm: "px-6 py-2 text-sm",
        md: "px-10 py-2.5 text-base",
        lg: "px-14 py-3 text-2xl",
      }[props.size];

    if (props.color === "white") {
      return `${baseClass} ${textBase} ${sizeClass} bg-white/80 backdrop-blur-md text-primary border border-white/20 hover:bg-teal/40 hover:scale-[1.02] active:scale-[0.98]`;
    }

    if (props.color === "teal") {
      return `${baseClass} ${textBase} ${sizeClass} bg-teal-300 text-teal-950 hover:bg-teal-200 hover:scale-105 active:scale-95`;
    }
  }

  return baseClass;
});
</script>

<template>
  <Primitive :as="as" :as-child="asChild" :class="[buttonClass, props.class]">
    <slot />
  </Primitive>
</template>
