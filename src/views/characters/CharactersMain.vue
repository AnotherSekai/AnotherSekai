<script setup lang="ts">
import { useRouter } from "vue-router";
import { Pencil, Dumbbell, Shirt, Trophy, Users } from "lucide-vue-next";
import ShowLayout from "@/components/layout/SubLayout.vue";

const router = useRouter();

const menuItems = [
  {
    label: "EDIT",
    icon: Pencil,
    gradient: "from-amber-400 to-orange-400",
    large: true,
  },
  {
    label: "TRAINING",
    icon: Dumbbell,
    gradient: "from-amber-300 to-yellow-400",
    large: true,
  },
  {
    label: "COSTUMES",
    icon: Shirt,
    gradient: "from-white/40 to-white/20",
    large: false,
  },
  {
    label: "CHARACTER RANK",
    icon: Trophy,
    gradient: "from-white/40 to-white/20",
    large: false,
  },
];
</script>

<template>
  <ShowLayout watermarkText="CHARACTERS">
    <div class="space-y-3">
      <!-- SELECT MENU label -->
      <div class="flex items-center gap-2 mb-1">
        <Users class="h-4 w-4 text-white/70" :stroke-width="2" />
        <span class="text-xs font-black tracking-[0.2em] text-white/80 uppercase">Select Menu</span>
      </div>

      <!-- Large cards row: EDIT & TRAINING -->
      <div class="grid grid-cols-2 gap-2.5">
        <button
          v-for="item in menuItems.filter((i) => i.large)"
          :key="item.label"
          :class="[
            'group relative rounded-2xl p-4 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 overflow-hidden min-h-[100px] flex flex-col items-center justify-center gap-2 bg-gradient-to-br',
            item.gradient,
          ]"
        >
          <div class="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent rounded-2xl" />
          <div class="relative w-10 h-10 rounded-full bg-white/25 flex items-center justify-center">
            <component
              :is="item.icon"
              class="h-6 w-6 text-white drop-shadow-md"
              :stroke-width="2.5"
            />
          </div>
          <span class="relative text-white font-black text-sm tracking-wide drop-shadow-md">{{
            item.label
          }}</span>
        </button>
      </div>

      <!-- Small cards row: COSTUMES & CHARACTER RANK -->
      <div class="grid grid-cols-2 gap-2.5">
        <button
          v-for="item in menuItems.filter((i) => !i.large)"
          :key="item.label"
          :class="[
            'group relative bg-gradient-to-br backdrop-blur-md rounded-2xl p-3 shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 flex flex-col items-center justify-center gap-2 min-h-[80px] border border-white/20',
            item.gradient,
          ]"
        >
          <component :is="item.icon" class="h-6 w-6 text-white/80" :stroke-width="2" />
          <span class="text-white/90 font-black text-xs tracking-wide text-center leading-tight">{{
            item.label
          }}</span>
        </button>
      </div>

      <!-- CHARACTERS full-width button -->
      <RouterLink to="/characters/list">
        <button
          class="w-full flex items-center gap-3 bg-white/30 backdrop-blur-md rounded-2xl px-4 py-3.5 shadow-md hover:shadow-lg hover:bg-white/40 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 border border-white/20"
          @click="router.push('/characters')"
        >
          <div
            class="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"
          >
            <Users class="h-5 w-5 text-white/80" :stroke-width="2" />
          </div>
          <span class="text-white/90 font-black text-sm tracking-wide">CHARACTERS</span>
        </button>
      </RouterLink>
    </div>
  </ShowLayout>
</template>
