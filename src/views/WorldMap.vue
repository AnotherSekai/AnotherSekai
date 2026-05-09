<script setup lang="ts">
import { ref } from "vue";
import SubpageHeader from "@/components/layout/SubpageHeader.vue";
import BackgroundLayer from "@/components/common/BackgroundLayer.vue";

const ids = ["05", "07", "08", "09", "10"];
const getUrl = (id: string) =>
  `/storage/sekai-jp-assets/worldmap/contents/normal/img_worldmap_areas${id}.webp`;

// We use rotateY to control the 3D rotation of the carousel container
const rotateY = ref(0);
const isDragging = ref(false);
let startX = 0;
let currentRotateY = 0;

const onPointerDown = (e: PointerEvent) => {
  isDragging.value = true;
  startX = e.clientX;
  currentRotateY = rotateY.value;
  (e.target as HTMLElement)?.setPointerCapture(e.pointerId);
};

const onPointerMove = (e: PointerEvent) => {
  if (!isDragging.value) return;
  const dx = e.clientX - startX;
  // sensitivity: 0.5 degrees per pixel dragged
  rotateY.value = currentRotateY + dx * 0.5;
};

const onPointerUp = (e: PointerEvent) => {
  if (!isDragging.value) return;
  isDragging.value = false;
  (e.target as HTMLElement)?.releasePointerCapture(e.pointerId);

  // Optional: Snap to the nearest 72 degrees (since 360 / 5 = 72)
  const anglePerItem = 72;
  rotateY.value = Math.round(rotateY.value / anglePerItem) * anglePerItem;
};

const onWheel = (e: WheelEvent) => {
  // Use scroll up/down to rotate left/right
  const delta = e.deltaY > 0 ? -1 : 1;
  rotateY.value += delta * 15;
};

const getItemTransform = (index: number, currentY: number) => {
  const angle = (index * 72 + currentY) * (Math.PI / 180);
  const x = Math.sin(angle) * 480;
  const y = Math.cos(angle) * 120;
  const z = Math.cos(angle) * 250 - 250;
  return `translate3d(${x}px, ${y}px, ${z}px)`;
};
</script>

<template>
  <BackgroundLayer useMask>
    <SubpageHeader title="World Map" />
    <div class="worldmap-container" @wheel.prevent="onWheel">
      <div
        class="scene"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div class="carousel" :class="{ dragging: isDragging }">
          <div
            v-for="(id, index) in ids"
            :key="id"
            class="carousel-item"
            :style="{ transform: getItemTransform(index, rotateY) }"
          >
            <img :src="getUrl(id)" class="carousel-image" draggable="false" />
          </div>
        </div>
      </div>
    </div>
  </BackgroundLayer>
</template>

<style scoped>
.worldmap-container {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  user-select: none;
  touch-action: none;
}

.scene {
  width: 100%;
  height: 100%;
  perspective: 1200px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: grab;
}

.scene:active {
  cursor: grabbing;
}

.carousel {
  width: 500px;
  height: 500px;
  position: relative;
  transform-style: preserve-3d;
}

.carousel-item {
  position: absolute;
  width: 500px;
  height: 500px;
  left: 0;
  top: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.carousel.dragging .carousel-item {
  transition: none; /* No transition while actively dragging to reduce lag */
}

.carousel-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 10px 20px rgba(0, 0, 0, 0.5));
}
</style>
