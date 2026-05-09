<script setup lang="ts">
import SubpageHeader from "../components/layout/SubpageHeader.vue";
import BackgroundLayer from "@/components/common/BackgroundLayer.vue";
import Backpack from "@/components/features/mysekai/Backpack.vue";
</script>

<template>
  <BackgroundLayer :useMask="true">
    <div class="relative z-10 flex flex-col h-full">
      <!-- SubpageHeader for navigation -->
      <SubpageHeader class="z-50 relative shrink-0" />

      <!-- Main content -->
      <div class="flex-1 overflow-y-auto px-4 py-6">
        <Backpack />
      </div>
    </div>
  </BackgroundLayer>
</template>
