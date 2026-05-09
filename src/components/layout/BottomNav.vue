<script setup lang="ts">
import { useRouter } from "vue-router";
import { Sparkles, Users, BookOpen, Home, Music } from "lucide-vue-next";

const router = useRouter();

const tabs = [
  { id: "gacha", label: "GACHA", icon: Sparkles, path: "/gacha" },
  { id: "characters", label: "CHARACTERS", icon: Users, path: "/characters" },
  { id: "story", label: "STORY", icon: BookOpen, path: "/story" },
  { id: "mysekai", label: "MYSEKAI", icon: Home, path: "/mysekai" },
  { id: "show", label: "SHOW", icon: Music, path: "/show" },
];


function navigate(tab: (typeof tabs)[number]) {
  router.push(tab.path);
}
</script>

<template>
  <nav class="absolute bottom-3 left-[22%] right-0 z-50">
    <div class="bg-black/40 backdrop-blur-md rounded-l-full px-2 py-1.5 shadow-2xl">
      <div class="flex items-center justify-around">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="relative flex flex-row items-center gap-2 px-6 py-2 rounded-full transition-all duration-200 hover:bg-white/10"
          @click="navigate(tab)"
        >
          <div class="relative">
            <component
              :is="tab.icon"
              class="h-6 w-6 transition-colors text-white"
            />
            <!-- Notification badge -->

          </div>
          <span
            class="text-sm font-black tracking-wide transition-colors whitespace-nowrap text-white"
          >
            {{ tab.label }}
          </span>
        </button>
      </div>
    </div>
  </nav>
</template>
