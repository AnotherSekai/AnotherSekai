<script setup lang="ts">
import { ref, watch } from "vue";

const props = defineProps<{
  src: string;
  alt?: string;
  class?: string;
}>();

const isLoaded = ref(false);
const hasError = ref(false);

watch(
  () => props.src,
  () => {
    isLoaded.value = false;
    hasError.value = false;
  },
);
</script>

<template>
  <div class="lazy-image-wrapper" :class="props.class">
    <div class="lazy-image-inner">
      <div
        v-if="!isLoaded"
        class="lazy-image-placeholder"
        :class="{ 'lazy-image-placeholder--failed': hasError }"
      />
      <img
        :src="props.src"
        :alt="props.alt ?? ''"
        loading="lazy"
        decoding="async"
        class="lazy-image"
        :class="{ 'lazy-image--loaded': isLoaded }"
        @load="isLoaded = true"
        @error="hasError = true"
      />
    </div>
  </div>
</template>

<style scoped>
.lazy-image-wrapper {
  overflow: hidden;
  width: 100%;
  height: 100%;
}

.lazy-image-inner {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: inherit;
}

.lazy-image-placeholder {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    110deg,
    rgba(255, 255, 255, 0.08) 30%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0.08) 70%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
  border-radius: inherit;
}

.lazy-image-placeholder--failed {
  animation: none;
  background: rgba(0, 0, 0, 0.08);
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.lazy-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image--loaded {
  opacity: 1;
}
</style>
