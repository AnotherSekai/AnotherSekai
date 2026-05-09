<script setup lang="ts">
import { ref } from "vue";
import { Sparkles } from "lucide-vue-next";

const activeDot = ref(0);
const totalDots = 8;
</script>

<template>
  <div class="absolute bottom-16 left-3 z-40 max-w-[260px]">
    <!-- Banner card -->
    <div
      class="relative bg-gradient-to-r from-fuchsia-600 via-pink-500 to-rose-500 rounded-2xl px-4 py-3 shadow-xl overflow-hidden border border-pink-400/30"
    >
      <!-- Sparkle decorations -->
      <div class="absolute top-1.5 right-8 opacity-60">
        <Sparkles class="h-4 w-4 text-yellow-200" />
      </div>
      <div class="absolute bottom-2 right-3 opacity-40">
        <Sparkles class="h-3 w-3 text-yellow-200" />
      </div>

      <!-- Content -->
      <div class="relative z-10">
        <p class="text-white/90 text-[11px] font-medium mb-0.5">
          Maximize your gameplay experience!
        </p>
        <p class="text-white font-black text-lg tracking-wide leading-tight">
          COLORFUL<span class="text-yellow-300">+</span><span class="text-white/70 text-xs font-medium align-top ml-0.5">plus</span>
        </p>
      </div>

      <!-- Gradient overlay -->
      <div
        class="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-white/10 rounded-2xl"
      />
    </div>

    <!-- Dot indicators -->
    <div class="flex gap-1.5 mt-2 px-1">
      <button
        v-for="i in totalDots"
        :key="i"
        class="h-2 rounded-full transition-all duration-300"
        :class="
          i - 1 === activeDot
            ? 'bg-white w-4 shadow-sm shadow-white/50'
            : 'bg-white/40 hover:bg-white/60 w-2'
        "
        @click="activeDot = i - 1"
      />
    </div>
  </div>
</template>
