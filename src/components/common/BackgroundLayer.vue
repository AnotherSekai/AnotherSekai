<script setup lang="ts">
import { computed } from "vue";
import { getCookie } from "../../utils/cookie";

const props = defineProps<{
  backgroundImage?: string;
  useMask?: boolean;
}>();

const globalBg = getCookie("sekai-bg", "");
const finalBackgroundImage = computed(() => {
  if (props.backgroundImage) {
    return props.backgroundImage
  }
  return `/storage/sekai-jp-assets/scenario/background/${globalBg}/${globalBg}.webp`;
});
</script>

<template>
  <!-- Background with blur and dot texture -->
  <div
    class="w-full h-full relative overflow-hidden bg-cover bg-center"
    :style="{
      backgroundImage: finalBackgroundImage ? `url(&quot;${finalBackgroundImage}&quot;)` : 'none',
    }"
  >
    <!-- Blur Mask -->
    <div v-if="props.useMask" class="absolute inset-0 bg-white/30 backdrop-blur-sm"></div>

    <!-- Custom Dot Pattern Background -->
    <div
      v-if="props.useMask"
      class="absolute inset-0"
      style="
        background-image: radial-gradient(
          circle at 2px 2px,
          rgba(255, 255, 255, 0.15) 1px,
          transparent 0
        );
        background-size: 16px 16px;
      "
    ></div>

    <slot></slot>
  </div>
</template>
