<script setup lang="ts">
import { ChevronLeft, MenuIcon } from "@lucide/vue";
import { useRouter } from "vue-router";
import { inject } from "vue";
import { Button } from "@/components/ui/button";

const router = useRouter();
const openMenu = inject<() => void>("openMenu");
</script>

<template>
  <header
    class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
  >
    <!-- LEFT: Back Button -->
    <Button variant="glass" size="icon-lg" aria-label="Go back" @click="router.back()">
      <ChevronLeft class="h-5 w-5" />
    </Button>

    <!-- MIDDLE: Dynamic Content Slot -->
    <div class="flex-1 px-4">
      <slot></slot>
    </div>

    <!-- RIGHT: Menu Button -->
    <Button variant="glass" size="icon-lg" aria-label="Open menu" @click="openMenu?.()">
      <MenuIcon class="h-5 w-5" />
    </Button>
  </header>
</template>
