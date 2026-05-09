<script setup lang="ts">
import { ref, onUnmounted, watch } from "vue";
import { useIntersectionObserver } from "@vueuse/core";

const props = defineProps<{
  src: string;
  alt?: string;
  class?: string;
}>();

const imageRef = ref<HTMLImageElement | null>(null);
const isVisible = ref(false);
const isLoaded = ref(false);

const { stop } = useIntersectionObserver(
  imageRef,
  ([entry]) => {
    if (entry?.isIntersecting) {
      isVisible.value = true;
      stop(); // stop observing once visible
    }
  },
  {
    rootMargin: "200px", // start loading 200px before entering viewport
  },
);

watch(
  () => props.src,
  () => {
    isLoaded.value = false;
  },
);

onUnmounted(() => {
  stop();
});
</script>

<template>
  <div class="lazy-image-wrapper" :class="props.class">
    <div v-if="!isLoaded" class="lazy-image-placeholder" />
    <img
      ref="imageRef"
      :src="isVisible ? props.src : undefined"
      :alt="props.alt ?? ''"
      class="lazy-image"
      :class="{ 'lazy-image--loaded': isLoaded }"
      @load="isLoaded = true"
    />
  </div>
</template>

<style scoped>
.lazy-image-wrapper {
  overflow: hidden;
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
  height: auto;
  object-fit: cover;
  border-radius: inherit;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.lazy-image--loaded {
  opacity: 1;
}
</style>
