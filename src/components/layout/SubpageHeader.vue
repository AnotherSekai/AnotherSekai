<script setup lang="ts">
import { ChevronLeft, MenuIcon } from "lucide-vue-next";
import { useRouter } from "vue-router";
import { inject } from "vue";
import CommonButton from "../common/CommonButton.vue";

const router = useRouter();
const openMenu = inject<() => void>("openMenu");
</script>

<template>
  <header
    class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
  >
    <!-- LEFT: Back Button -->
    <CommonButton type="icon" color="white" @click="router.back()">
      <ChevronLeft class="h-5 w-5" />
    </CommonButton>

    <!-- MIDDLE: Dynamic Content Slot -->
    <div class="flex-1 px-4">
      <slot></slot>
    </div>

    <!-- RIGHT: Menu Button -->
    <CommonButton type="icon" color="white" @click="openMenu?.()">
      <MenuIcon class="h-5 w-5" />
    </CommonButton>
  </header>
</template>
