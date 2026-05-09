<script setup lang="ts">
import { ref, provide } from "vue";
import MenuPanel from "./components/features/MenuPanel.vue";

const menuOpen = ref(false);

const openMenu = () => {
  menuOpen.value = true;
};

// Provide the openMenu function globally to all router-views and children
provide("openMenu", openMenu);
</script>

<template>
  <div class="relative w-screen h-screen overflow-hidden select-none">
    <!-- Page content via router -->
    <router-view />

    <!-- Menu slide panel -->
    <MenuPanel :open="menuOpen" @close="menuOpen = false" />
  </div>
</template>

<style scoped></style>
