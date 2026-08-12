<script setup lang="ts">
import {
  Search,
  Filter,
  List,
  Music,
  Star,
  Clover,
  Moon,
  Crown,
  Share,
  Mic2,
  Play,
  Pause,
  Cross,
} from "@lucide/vue";
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import { useVirtualGrid } from "@/composables/useVirtualGrid";
import axios from "axios";
import SubpageHeader from "@/components/layout/SubpageHeader.vue";
import LazyImage from "@/components/common/LazyImage.vue";
import { getCookie } from "@/utils/cookie";
import CommonButton from "@/components/common/CommonButton.vue";

// Sidebar filters
const bands = [
  { id: "all", label: "All", icon: null, active: true },
  { id: "vocaloid", label: "", icon: Music, active: false },
  { id: "light_music_club", label: "", icon: Star, active: false },
  { id: "idol", label: "", icon: Clover, active: false },
  { id: "street", label: "", icon: Moon, active: false },
  { id: "theme_park", label: "", icon: Crown, active: false },
  { id: "school_refusal", label: "", icon: Cross, active: false },
  { id: "other", label: "Other", icon: null, active: false },
];

const selectedBand = ref("all");

export interface UIMusicNode {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audioSrc: string | null;
  tags: string[];
  difficulties: Record<string, number>;
  searchText: string;
}

const isLoading = ref(true);
const allMusicList = shallowRef<UIMusicNode[]>([]);
const selectedMusic = ref<UIMusicNode | null>(null);
const searchQuery = ref("");
const isListView = ref(false);

const musicList = computed(() => {
  let filtered = allMusicList.value;
  if (selectedBand.value !== "all") {
    filtered = filtered.filter((m) => m.tags.includes(selectedBand.value));
  }
  if (searchQuery.value && searchQuery.value.trim()) {
    const q = searchQuery.value.trim().toLowerCase();
    filtered = filtered.filter((music) => music.searchText.includes(q));
  }
  return filtered;
});

const difficultyOptions = [
  {
    id: "easy",
    label: "EASY",
    borderColor: "border-emerald-400",
    textColor: "text-emerald-300",
    selectedBg: "bg-emerald-400/20",
    selectedShadow: "shadow-emerald-400/20",
    badgeBgColor: "bg-emerald-400",
    badgeTextColor: "text-black",
  },
  {
    id: "normal",
    label: "NORMAL",
    borderColor: "border-sky-400",
    textColor: "text-sky-300",
    selectedBg: "bg-sky-400/20",
    selectedShadow: "shadow-sky-400/20",
    badgeBgColor: "bg-sky-400",
    badgeTextColor: "text-white",
  },
  {
    id: "hard",
    label: "HARD",
    borderColor: "border-yellow-400",
    textColor: "text-yellow-300",
    selectedBg: "bg-yellow-400/20",
    selectedShadow: "shadow-yellow-400/20",
    badgeBgColor: "bg-yellow-400",
    badgeTextColor: "text-black",
  },
  {
    id: "expert",
    label: "EXPERT",
    borderColor: "border-rose-500",
    textColor: "text-rose-400",
    selectedBg: "bg-rose-500/20",
    selectedShadow: "shadow-rose-500/20",
    badgeBgColor: "bg-rose-500",
    badgeTextColor: "text-white",
  },
  {
    id: "master",
    label: "MASTER",
    borderColor: "border-purple-500",
    textColor: "text-purple-300",
    selectedBg: "bg-purple-500/20",
    selectedShadow: "shadow-purple-500/20",
    badgeBgColor: "bg-purple-500",
    badgeTextColor: "text-white",
  },
  {
    id: "append",
    label: "APPEND",
    borderColor: "bg-gradient-to-br from-pink-500 to-blue-500",
    textColor: "text-pink-300",
    selectedBg: "bg-pink-400/20",
    selectedShadow: "shadow-pink-400/20",
    badgeBgColor: "bg-gradient-to-br from-pink-500 to-blue-500",
    badgeTextColor: "text-white",
  },
] as const;

const selectedDifficulty = ref("hard");
const difficultyConfigById = new Map(difficultyOptions.map((option) => [option.id, option]));

const getBadgeDiffConfig = (diffId: string) => {
  return difficultyConfigById.get(diffId) ?? difficultyOptions[2];
};

watch([isListView, selectedBand, searchQuery], () => {
  nextTick(() => {
    if (gridContainer.value) {
      gridContainer.value.scrollTop = 0;
    }
  });
});

// Virtual Grid Setup
const gridContainer = ref<HTMLElement | null>(null);
const gridColumns = computed(() => (isListView.value ? 1 : 4));
const { visibleItems, totalHeight, offsetY } = useVirtualGrid({
  containerRef: gridContainer,
  items: musicList,
  columns: gridColumns,
  gap: 12, // gap-3 = 12px
  bufferRows: 4,
});

const musicRequestController = new AbortController();

onMounted(async () => {
  try {
    const region = getCookie("sekai-region", "en");
    const response = await axios.get<UIMusicNode[]>("/api/music", {
      params: { region },
      signal: musicRequestController.signal,
    });
    if (!Array.isArray(response.data)) throw new Error("Invalid music catalog response.");

    allMusicList.value = response.data;

    if (allMusicList.value.length > 0) {
      selectedMusic.value = allMusicList.value[0] ?? null;
    }
  } catch (error) {
    if (!axios.isCancel(error)) console.error("Failed to fetch music data:", error);
  } finally {
    isLoading.value = false;
  }
});

// --- Music Player ---
let audio: HTMLAudioElement | null = null;
const isPlaying = ref(false);
let playRequestId = 0;

const handleAudioEnded = () => {
  isPlaying.value = false;
};

const handleAudioError = () => {
  isPlaying.value = false;
};

onMounted(() => {
  audio = new Audio();
  audio.preload = "none";
  audio.addEventListener("ended", handleAudioEnded);
  audio.addEventListener("error", handleAudioError);
});

watch(selectedMusic, (newMusic) => {
  if (!newMusic || !audio) return;
  const requestId = ++playRequestId;
  // Stop current, switch track
  audio.pause();
  isPlaying.value = false;
  if (!newMusic.audioSrc) {
    audio.removeAttribute("src");
    audio.load();
    return;
  }
  audio.src = newMusic.audioSrc;
  const isSilent = getCookie("sekai-bgm-silent", "false") === "true";

  if (!isSilent) {
    audio
      .play()
      .then(() => {
        if (requestId === playRequestId) isPlaying.value = true;
      })
      .catch(() => {
        // Autoplay may be blocked by browser
        if (requestId === playRequestId) isPlaying.value = false;
      });
  } else {
    isPlaying.value = false;
  }
});

const togglePlay = async () => {
  if (!audio || !selectedMusic.value?.audioSrc) return;
  if (audio.paused) {
    try {
      await audio.play();
      isPlaying.value = true;
    } catch {
      isPlaying.value = false;
    }
  } else {
    audio.pause();
    isPlaying.value = false;
  }
};

onUnmounted(() => {
  musicRequestController.abort();
  playRequestId += 1;
  if (audio) {
    audio.pause();
    audio.removeEventListener("ended", handleAudioEnded);
    audio.removeEventListener("error", handleAudioError);
    audio.removeAttribute("src");
    audio.load();
    audio = null;
  }
});
</script>

<template>
  <div class="absolute inset-0 z-10 bg-[#B8BBEA] text-white overflow-hidden flex flex-col">
    <!-- Subpage Header with injected controls -->
    <SubpageHeader>
      <div class="flex items-center gap-3 w-full pl-6 pr-2">
        <!-- Search Bar -->
        <div class="relative flex-1 max-w-md">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by song title or artist"
            class="w-full bg-white/90 backdrop-blur-sm rounded-full py-1.5 pl-4 pr-10 text-gray-800 text-sm font-semibold placeholder:text-gray-500 outline-none shadow-md border border-white/20"
          />
          <Search class="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        </div>

        <!-- List Toggle -->
        <button
          class="bg-white/90 backdrop-blur-sm rounded-full flex items-center gap-2 px-3 py-1.5 shadow-md hover:bg-white transition-colors text-gray-800 border border-white/20"
          @click="isListView = !isListView"
        >
          <List class="h-4 w-4 text-indigo-500" />
          <span class="text-xs font-bold pr-1">{{ isListView ? "List" : "Grid" }}</span>
        </button>

        <div class="flex-1" />

        <!-- Filter & Sort -->
        <button
          class="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-white transition-colors border border-white/20"
        >
          <Filter class="h-4 w-4 text-gray-700" />
        </button>

        <button
          class="bg-white/90 backdrop-blur-sm rounded-full px-6 py-1.5 shadow-md hover:bg-white transition-colors flex items-center justify-center min-w-[120px] border border-white/20"
        >
          <span class="text-sm font-bold text-gray-800 tracking-wide">Default</span>
        </button>
      </div>
    </SubpageHeader>

    <div class="flex-1 flex overflow-hidden pt-12">
      <!-- LEFT SIDEBAR: Band Switcher -->
      <div
        class="w-16 flex flex-col items-center py-4 bg-black/20 backdrop-blur-md rounded-r-2xl my-4 ml-0 shadow-xl border border-white/10 z-20"
      >
        <div
          class="flex-1 overflow-y-auto no-scrollbar w-full flex flex-col items-center space-y-3 pb-8"
        >
          <button
            v-for="band in bands"
            :key="band.id"
            class="relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200"
            :class="
              selectedBand === band.id
                ? 'bg-white/30 text-emerald-300'
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            "
            @click="selectedBand = band.id"
          >
            <span v-if="band.label" class="text-[12px] font-bold tracking-wider">{{
              band.label
            }}</span>
            <component v-else :is="band.icon" class="h-5 w-5" />
          </button>

          <!-- Down indicator for more scroll -->
          <div class="w-0 h-0 border-x-4 border-x-transparent border-t-6 border-t-white/40 mt-2" />
        </div>
      </div>

      <!-- MAIN CONTENT AREA (Left Grid, Right Panel) -->
      <div class="flex-1 flex gap-4 h-full pl-4 pr-6 py-4 min-h-0">
        <!-- LEFT: Music Grid / List -->
        <div ref="gridContainer" class="flex-[3] overflow-y-auto pr-2 custom-scrollbar relative">
          <div v-if="isLoading" class="flex items-center justify-center h-full">
            <span class="text-white/60 font-bold animate-pulse">Loading music...</span>
          </div>

          <!-- GRID VIEW -->
          <div
            v-else-if="!isListView"
            class="relative w-full"
            :style="{ height: `${totalHeight + 80}px` }"
          >
            <div
              class="absolute top-0 left-0 right-0 grid grid-cols-4 gap-3 p-2 pb-20 will-change-transform"
              :style="{ transform: `translateY(${offsetY}px)` }"
            >
              <button
                v-for="{ item } in visibleItems"
                :key="item.id"
                class="relative rounded-lg overflow-hidden w-full group outline-none"
                :class="
                  selectedMusic?.id === item.id
                    ? 'ring-4 ring-white ring-offset-2 ring-offset-[#B8BBEA] scale-[0.98] z-10'
                    : 'hover:scale-[1.02] transition-transform shadow-md'
                "
                @click="selectedMusic = item"
                data-virtual-item
              >
                <div
                  class="relative w-full h-full rounded-lg overflow-hidden pb-[100%] bg-black/10"
                >
                  <LazyImage
                    :src="item.cover"
                    class="absolute inset-0 w-full h-full object-cover rounded-lg block"
                  />
                  <div
                    class="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
                  />
                  <div
                    class="absolute top-0 left-0 font-black text-sm px-1.5 py-0.5 rounded-br-lg shadow-sm"
                    :class="[
                      getBadgeDiffConfig(selectedDifficulty).badgeBgColor,
                      getBadgeDiffConfig(selectedDifficulty).badgeTextColor,
                    ]"
                  >
                    {{ item.difficulties[selectedDifficulty] || "?" }}
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- LIST VIEW -->
          <div v-else class="relative w-full" :style="{ height: `${totalHeight + 80}px` }">
            <div
              class="absolute inset-x-0 top-0 flex flex-col gap-3 p-2 pb-20 will-change-transform"
              :style="{ transform: `translateY(${offsetY}px)` }"
            >
              <button
                v-for="{ item } in visibleItems"
                :key="item.id"
                data-virtual-item
                class="flex items-center gap-3 px-3 py-2 rounded-xl transition-all outline-none"
                :class="
                  selectedMusic?.id === item.id
                    ? 'bg-white/25 ring-2 ring-white/40'
                    : 'bg-white/5 hover:bg-white/15'
                "
                @click="selectedMusic = item"
              >
                <div class="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                  <LazyImage :src="item.cover" class="w-full h-full object-cover block" />
                </div>
                <div class="flex-1 min-w-0 text-left">
                  <p class="text-sm font-bold text-white truncate">{{ item.title }}</p>
                  <p class="text-xs text-white/60 truncate">{{ item.artist }}</p>
                </div>
                <div class="flex items-center gap-1 flex-shrink-0">
                  <span
                    v-for="diff in difficultyOptions"
                    :key="diff.id"
                    v-show="item.difficulties[diff.id] !== undefined"
                    class="text-[10px] font-black px-1.5 py-0.5 rounded-md min-w-[24px] text-center"
                    :class="[diff.badgeBgColor, diff.badgeTextColor]"
                  >
                    {{ item.difficulties[diff.id] }}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        <!-- RIGHT: Detail Panel -->
        <div class="flex-[2] h-full flex flex-col justify-end pb-8">
          <div
            class="bg-[#787CBF]/60 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20 relative w-full"
          >
            <!-- Top Right Action -->
            <button class="absolute top-4 right-4 text-white/70 hover:text-white transition-colors">
              <Share class="h-5 w-5" />
            </button>

            <!-- Details Content -->
            <div v-if="selectedMusic" class="flex flex-col items-center">
              <!-- Large Cover -->
              <div class="w-48 h-48 rounded-2xl overflow-hidden shadow-2xl mb-6 relative">
                <img :src="selectedMusic.cover" class="w-full h-full object-cover" />
              </div>

              <!-- Song Info -->
              <div class="w-full relative">
                <h2
                  class="text-2xl font-black text-white leading-tight mb-1 drop-shadow-md pr-12 min-h-[3rem]"
                >
                  {{ selectedMusic.title }}
                </h2>
                <p class="text-sm font-semibold text-white/90 truncate min-h-[1.25rem]">
                  {{ selectedMusic.artist }}
                </p>
                <!-- Vocals removed since we don't have them in API for now -->
                <p class="text-sm font-semibold text-white/90 truncate mb-6 opacity-0">
                  Placeholder
                </p>

                <div
                  class="absolute bottom-4 right-0 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm border border-white/10 shadow-lg"
                >
                  <span class="text-3xl font-black">S</span>
                </div>
              </div>

              <!-- Difficulty Badges -->
              <div class="flex items-center justify-between w-full mb-8 px-2">
                <div
                  v-for="diff in difficultyOptions"
                  :key="diff.id"
                  v-show="selectedMusic.difficulties[diff.id] !== undefined"
                  class="flex flex-col items-center gap-1.5 cursor-pointer transition-all duration-200"
                  :class="[
                    selectedDifficulty !== diff.id ? 'opacity-50 hover:opacity-80' : 'scale-110',
                  ]"
                  @click="selectedDifficulty = diff.id"
                >
                  <div
                    class="w-11 h-11 rounded-full border-[3px] flex items-center justify-center font-black text-xl shadow-inner text-white transition-colors"
                    :class="[
                      diff.borderColor,
                      selectedDifficulty === diff.id
                        ? [diff.selectedBg, diff.selectedShadow]
                        : 'bg-black/20',
                    ]"
                  >
                    {{ selectedMusic.difficulties[diff.id] }}
                  </div>
                  <span class="text-[9px] font-black tracking-widest" :class="diff.textColor">
                    {{ diff.label }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <CommonButton type="text" color="teal" size="md"> Select </CommonButton>

              <hr />

              <div class="flex items-center gap-8 text-white/80">
                <button class="hover:text-white transition-colors" @click="togglePlay">
                  <Pause v-if="isPlaying" class="h-6 w-6" />
                  <Play v-else class="h-6 w-6" />
                </button>
                <button class="hover:text-white transition-colors">
                  <Mic2 class="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Hidden scrollbar but keep functionality */
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

/* Custom scrollbar for waterfall */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
