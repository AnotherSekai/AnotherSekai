<script setup lang="ts">
import { ref, computed, onMounted } from "vue";

import axios from "axios";
import LazyImage from "../../components/common/LazyImage.vue";
import { getRegion } from "../../utils/cookie";
import SubpageHeader from "../../components/layout/SubpageHeader.vue";
import BackgroundLayer from "@/components/common/BackgroundLayer.vue";

// Derived region for assets and API
const region = getRegion();
const dbSuffix = region === "jp" ? "" : `-${region}`;

const groups = [
  { id: "piapro", label: "VIRTUAL\nSINGER" },
  { id: "light_sound", label: "Leo/need" },
  { id: "idol", label: "MORE MORE JUMP!" },
  { id: "street", label: "Vivid BAD SQUAD" },
  { id: "theme_park", label: "Wonderlands×Showtime" },
  { id: "school_refusal", label: "Nightcord at 25:00" },
];

const selectedGroupId = ref(groups[0].id);

interface SekaiCharacter {
  id: number;
  gameCharacterId: number; // use `id` or `gameCharacterId` depending on the file, we'll fetch gameCharacterUnits or gameCharacters if needed. Wait, gameCharacters.json has `id`, `firstName`, etc. gameCharacterUnits has `colorCode`
  firstName: string;
  givenName: string;
  firstNameEnglish: string;
  givenNameEnglish: string;
  unit: string;
  colorCode?: string;
}

interface SekaiCharacterUnit {
  gameCharacterId: number;
  colorCode: string;
}

const allCharacters = ref<SekaiCharacter[]>([]);
const filteredCharacters = computed(() => {
  return allCharacters.value.filter((c) => c.unit === selectedGroupId.value);
});

onMounted(async () => {
  try {
    const [charRes, unitRes] = await Promise.all([
      axios.get<SekaiCharacter[]>(
        `/sekai-world/sekai-master-db${dbSuffix}-diff/gameCharacters.json`,
      ),
      axios.get<SekaiCharacterUnit[]>(
        `/sekai-world/sekai-master-db${dbSuffix}-diff/gameCharacterUnits.json`,
      ),
    ]);

    // Merge color info from gameCharacterUnits into gameCharacters
    const colorMap = new Map();
    if (unitRes.data) {
      unitRes.data.forEach((u) => {
        colorMap.set(u.gameCharacterId, u.colorCode);
      });
    }

    allCharacters.value = charRes.data.map((c) => ({
      id: c.id,
      gameCharacterId: c.id,
      firstName: c.firstName || "",
      givenName: c.givenName || "",
      firstNameEnglish: c.firstNameEnglish || "",
      givenNameEnglish: c.givenNameEnglish || "",
      unit: c.unit,
      colorCode: colorMap.get(c.id) || "#33aaee",
    }));
  } catch (error) {
    console.error("Failed to fetch characters:", error);
  }
});
</script>

<template>
  <BackgroundLayer  :useMask="true">


    <SubpageHeader />

    <div class="absolute top-16 bottom-8 left-6 right-4 flex z-10">
      <!-- Left Sidebar Tabs -->
      <div
        class="w-[20%] max-w-60 backdrop-blur-md rounded-2xl flex flex-col py-4 shadow-2xl border border-white/20 select-none overflow-y-auto no-scrollbar relative shrink-0"
      >
        <!-- Decoration dashed border inside -->
        <div
          class="absolute inset-2 border-[2px] border-dashed border-white/20 rounded-xl pointer-events-none px-2 py-4 flex flex-col gap-2"
        ></div>
        <div class="relative z-10 flex flex-col w-full h-full px-4 gap-2">
          <button
            v-for="group in groups"
            :key="group.id"
            class="relative w-full h-[76px] rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden outline-none"
            @click="selectedGroupId = group.id"
          >
            <!-- Background highlights for active state -->
            <div
              class="absolute inset-0 bg-white transition-opacity duration-300"
              :class="selectedGroupId === group.id ? 'opacity-20' : 'opacity-0'"
            ></div>

            <div class="relative z-10 flex flex-col items-center justify-center w-full h-full p-2">
              <img
                class="max-w-full max-h-full object-contain"
                :src="
                  selectedGroupId === group.id
                    ? `/images/${region}/logol_outline/logo_${group.id}.png`
                    : `/images/${region}/logol/logo_${group.id}.png`
                "
              />
            </div>
          </button>
        </div>
      </div>

      <!-- Right Main Content Area (Character List) -->
      <div
        ref="scrollContainer"
        class="flex-1 ml-6 h-full flex items-center gap-3 overflow-x-auto overflow-y-hidden select-none custom-scrollbar pr-10 pb-4 p-4"
      >
        <LazyImage
          v-for="char in filteredCharacters"
          :key="char.id"
          :src="`/storage/sekai-${region}-assets/character/character_select/chr_tl_${char.id}.webp`"
          class="hover:scale-105 transition-all duration-300 cursor-pointer"
          style="filter: drop-shadow(0 10px 10px rgba(0, 0, 0, 0.4))"
        />
      </div>
    </div>
  </BackgroundLayer>
</template>
