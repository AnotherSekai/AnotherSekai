<script setup lang="ts">
import { inject } from "vue";
import MissionPanel from "../components/features/home/MissionPanel.vue";
import SideButtons from "../components/features/home/SideButtons.vue";
import PromoBanner from "../components/features/home/PromoBanner.vue";
import TopBar from "../components/features/home/TopBar.vue";
import BottomNav from "../components/layout/BottomNav.vue";
import BackgroundLayer from "@/components/common/BackgroundLayer.vue";

const openMenu = inject<() => void>("openMenu");
</script>

<template>
  <BackgroundLayer :useMask="false">

    <MissionPanel />
    <SideButtons />
    <PromoBanner />
    <TopBar @open-menu="openMenu" />
    <BottomNav />

  </BackgroundLayer>
</template>
