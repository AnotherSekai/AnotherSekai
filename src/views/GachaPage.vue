<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { CalendarDays, RefreshCw, Sparkles } from "lucide-vue-next";
import SubpageHeader from "@/components/layout/SubpageHeader.vue";
import CommonButton from "@/components/common/CommonButton.vue";
import { getRegion } from "@/utils/cookie";
import {
  fetchLatestGachas,
  type GachaSummary,
} from "@/utils/gacha";

const region = getRegion();
const gachas = ref<GachaSummary[]>([]);
const selectedIndex = ref(0);
const isLoading = ref(true);
const errorMessage = ref("");
const failedBannerIds = ref(new Set<number>());

const selectedGacha = computed(() => gachas.value[selectedIndex.value] ?? null);
const displayedBackgroundUrl = computed(() => selectedGacha.value?.backgroundUrl ?? "");

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);

const availabilityLabel = computed(() => {
  const gacha = selectedGacha.value;
  if (!gacha) return "";
  return gacha.endAt > Date.now() ? "Available now" : "Recently ended";
});

const selectGacha = (index: number) => {
  selectedIndex.value = index;
};

const markBannerFailed = (gachaId: number) => {
  failedBannerIds.value = new Set(failedBannerIds.value).add(gachaId);
};

const loadGachas = async () => {
  isLoading.value = true;
  errorMessage.value = "";
  failedBannerIds.value = new Set();

  try {
    gachas.value = await fetchLatestGachas(region);
    selectedIndex.value = 0;
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : "The latest gachas could not be loaded.";
    console.error("Failed to load the latest gachas:", error);
  } finally {
    isLoading.value = false;
  }
};

onMounted(loadGachas);
</script>

<template>
  <main class="relative min-h-[100dvh] w-full overflow-hidden bg-[#102236] text-white">
    <Transition name="gacha-background" mode="out-in">
      <div
        :key="displayedBackgroundUrl || 'gacha-fallback'"
        class="absolute inset-0 bg-cover bg-center"
        :style="{
          backgroundImage: displayedBackgroundUrl ? `url(&quot;${displayedBackgroundUrl}&quot;)` : 'none',
        }"
      ></div>
    </Transition>

    <div class="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,20,36,0.68)_0%,rgba(7,20,36,0.15)_42%,rgba(7,20,36,0.08)_72%,rgba(7,20,36,0.34)_100%)]"></div>
    <div class="absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#081523]/90 via-[#081523]/38 to-transparent"></div>
    <div class="gacha-dots absolute inset-0 opacity-70"></div>

    <SubpageHeader class="relative z-50">
      <div class="hidden sm:flex items-center gap-2 text-white drop-shadow-md">
        <Sparkles class="h-4 w-4 text-cyan-200" />
        <span class="text-sm font-black tracking-[0.22em] uppercase">Gacha</span>
      </div>
    </SubpageHeader>

    <section
      v-if="isLoading"
      aria-label="Loading gachas"
      class="absolute inset-x-4 top-16 bottom-5 z-20 flex gap-5 sm:inset-x-6 sm:bottom-8"
    >
      <div class="hidden w-[clamp(220px,22vw,310px)] shrink-0 rounded-2xl border border-white/20 bg-black/25 p-4 backdrop-blur-xl sm:block">
        <div class="h-full overflow-hidden rounded-xl border-2 border-dashed border-white/20 p-3">
          <div v-for="item in 10" :key="item" class="mb-3 aspect-[21/9] animate-pulse rounded-xl bg-white/15"></div>
        </div>
      </div>
      <div class="flex flex-1 items-end p-4 sm:p-10">
        <div class="w-full max-w-xl rounded-2xl border border-white/15 bg-black/25 p-5 backdrop-blur-md">
          <div class="mb-4 h-20 w-2/3 animate-pulse rounded-xl bg-white/15"></div>
          <div class="h-5 w-1/2 animate-pulse rounded bg-white/10"></div>
        </div>
      </div>
    </section>

    <section
      v-else-if="errorMessage"
      class="absolute inset-0 z-20 flex items-center justify-center px-6"
    >
      <div class="max-w-md rounded-2xl border border-white/20 bg-[#101b2a]/80 p-7 text-center shadow-2xl backdrop-blur-xl">
        <p class="text-lg font-black">Gacha data is unavailable</p>
        <p class="mt-2 text-sm leading-6 text-white/70">{{ errorMessage }}</p>
        <CommonButton class="mx-auto mt-5 gap-2" color="teal" size="sm" @click="loadGachas">
          <RefreshCw class="h-4 w-4" />
          Retry
        </CommonButton>
      </div>
    </section>

    <section
      v-else-if="gachas.length"
      class="absolute inset-x-3 top-16 bottom-3 z-20 flex min-h-0 flex-col gap-3 sm:inset-x-6 sm:bottom-7 sm:flex-row sm:gap-5"
    >
      <aside
        aria-label="Latest gachas"
        class="relative shrink-0 rounded-2xl border border-white/20 bg-[#0d1d31]/42 p-3 shadow-2xl backdrop-blur-xl sm:w-[clamp(220px,22vw,310px)] sm:p-4"
      >
        <div class="pointer-events-none absolute inset-2 rounded-xl border-2 border-dashed border-white/20"></div>
        <div class="relative flex gap-3 overflow-x-auto p-1 sm:h-full sm:flex-col sm:overflow-x-hidden sm:overflow-y-auto sm:p-2 gacha-scrollbar">
          <button
            v-for="(gacha, index) in gachas"
            :key="gacha.id"
            type="button"
            class="group relative aspect-[21/9] w-[190px] shrink-0 overflow-hidden rounded-xl border-[3px] bg-[#172b42] text-left shadow-lg outline-none transition duration-300 focus-visible:ring-2 focus-visible:ring-cyan-200 sm:w-full"
            :class="
              selectedIndex === index
                ? 'border-cyan-300 shadow-[0_0_0_1px_rgba(255,255,255,0.8),0_12px_28px_rgba(34,211,238,0.2)] sm:translate-x-1'
                : 'border-transparent opacity-80 hover:border-white/55 hover:opacity-100'
            "
            :aria-pressed="selectedIndex === index"
            :aria-label="`Select ${gacha.name}`"
            @click="selectGacha(index)"
          >
            <img
              v-if="!failedBannerIds.has(gacha.id)"
              :src="gacha.bannerUrl"
              :alt="gacha.name"
              loading="lazy"
              class="h-full w-full object-cover transition duration-500 group-hover:scale-[1.025]"
              @error="markBannerFailed(gacha.id)"
            />
            <div
              v-else
              class="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#1a3047,#101d2d)] text-xs font-black uppercase tracking-[0.18em] text-white/60"
            >
              No image
            </div>
            <div class="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/5"></div>
            <span
              v-if="selectedIndex === index"
              class="absolute bottom-1.5 left-2 rounded-full bg-cyan-300 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-950"
            >
              Selected
            </span>
          </button>
        </div>
      </aside>

      <article class="relative flex min-h-0 flex-1 items-end overflow-hidden rounded-2xl sm:overflow-visible">
        <Transition name="gacha-focus" mode="out-in">
          <div
            v-if="selectedGacha"
            :key="selectedGacha.id"
            class="mb-2 w-full max-w-[720px] p-3 sm:mb-8 sm:ml-5 sm:p-6 lg:ml-10"
          >
            <img
              :src="selectedGacha.logoUrl"
              :alt="`${selectedGacha.name} logo`"
              class="mb-3 h-[clamp(82px,17vh,190px)] max-w-[min(90vw,620px)] object-contain object-left-bottom drop-shadow-[0_8px_14px_rgba(0,0,0,0.55)] sm:mb-5"
            />

            <div class="inline-flex max-w-full flex-col rounded-2xl border border-white/20 bg-[#0b1727]/60 px-4 py-3 shadow-2xl backdrop-blur-md sm:px-5 sm:py-4">
              <div class="mb-1 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-200">
                <span class="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]"></span>
                {{ availabilityLabel }}
              </div>
              <h1 class="line-clamp-2 text-xl font-black leading-tight drop-shadow-md sm:text-2xl lg:text-3xl">
                {{ selectedGacha.name }}
              </h1>
              <div class="mt-2 flex items-center gap-2 text-xs font-semibold text-white/75 sm:text-sm">
                <CalendarDays class="h-4 w-4 shrink-0 text-white/60" />
                <span>{{ formatDate(selectedGacha.startAt) }} - {{ formatDate(selectedGacha.endAt) }}</span>
              </div>
            </div>
          </div>
        </Transition>
      </article>
    </section>

    <section v-else class="absolute inset-0 z-20 flex items-center justify-center text-white/75">
      No recent gachas were found.
    </section>
  </main>
</template>

<style scoped>
.gacha-dots {
  background-image: radial-gradient(circle at 2px 2px, rgba(255, 255, 255, 0.14) 1px, transparent 0);
  background-size: 16px 16px;
}

.gacha-background-enter-active,
.gacha-background-leave-active {
  transition: opacity 500ms ease, transform 700ms ease;
}

.gacha-background-enter-from,
.gacha-background-leave-to {
  opacity: 0;
  transform: scale(1.025);
}

.gacha-focus-enter-active,
.gacha-focus-leave-active {
  transition: opacity 240ms ease, transform 300ms ease;
}

.gacha-focus-enter-from,
.gacha-focus-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.gacha-scrollbar {
  scrollbar-color: rgba(255, 255, 255, 0.38) transparent;
  scrollbar-width: thin;
}

.gacha-scrollbar::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.gacha-scrollbar::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.38);
}

@media (prefers-reduced-motion: reduce) {
  .gacha-background-enter-active,
  .gacha-background-leave-active,
  .gacha-focus-enter-active,
  .gacha-focus-leave-active {
    transition: none;
  }
}
</style>
