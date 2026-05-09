<script setup lang="ts"></script>

<template>
  <div class="absolute top-16 left-3 z-40 max-w-[250px]">
    <!-- Mission Card -->
    <div
      class="bg-white/95 backdrop-blur-md rounded-2xl px-4 py-3 shadow-xl flex items-center gap-3 border border-white/60"
    >
      <p class="text-gray-800 text-sm font-medium leading-snug flex-1">
        Clear a Co-op/Cheerful Show.
      </p>
      <div class="flex flex-col items-center gap-0.5 shrink-0">
        <img
          :src="'/storage/sekai-jp-assets/thumbnail/common_material/jewel.webp'"
          alt=""
          class="w-11 h-11 rounded-xl"
        />
        <span class="text-[10px] text-gray-500 font-medium">×100</span>
      </div>
    </div>
  </div>
</template>
