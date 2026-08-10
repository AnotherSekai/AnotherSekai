<script setup lang="ts">
import { onMounted, ref } from "vue";
import {
  CalendarDays,
  History,
  Radio,
  RefreshCw,
  Sparkles,
  UsersRound,
} from "@lucide/vue";
import ShowLayout from "@/components/layout/SubLayout.vue";
import VirtualShowDetailDialog from "@/components/features/show/VirtualShowDetailDialog.vue";
import { getRegion } from "@/utils/cookie";
import {
  fetchVirtualShows,
  type VirtualShowScope,
  type VirtualShowSummary,
} from "@/utils/virtualShows";

const region = getRegion();
const scope = ref<VirtualShowScope>("active");
const shows = ref<VirtualShowSummary[]>([]);
const selectedShow = ref<VirtualShowSummary | null>(null);
const dialogOpen = ref(false);
const page = ref(1);
const total = ref(0);
const hasMore = ref(false);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const errorMessage = ref("");
const failedPrimaryImages = ref(new Set<number>());
const failedImages = ref(new Set<number>());
let requestId = 0;

const formatDate = (timestamp: number) =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(timestamp);

const getStatusLabel = (show: VirtualShowSummary) => {
  if (show.status === "live") return "Live now";
  if (show.status === "ended") return `Ended ${formatDate(show.endAt)}`;
  if (!show.nextScheduleAt) return `Begins ${formatDate(show.startAt)}`;

  const difference = show.nextScheduleAt - Date.now();
  const days = Math.ceil(difference / 86_400_000);
  if (days > 1) return `Begins in ${days} days`;
  return `Next ${formatDate(show.nextScheduleAt)}`;
};

const getImageUrl = (show: VirtualShowSummary) =>
  failedPrimaryImages.value.has(show.id) ? show.bannerUrl : show.cardImageUrl;

const handleImageError = (show: VirtualShowSummary) => {
  if (!failedPrimaryImages.value.has(show.id)) {
    failedPrimaryImages.value = new Set(failedPrimaryImages.value).add(show.id);
    return;
  }
  failedImages.value = new Set(failedImages.value).add(show.id);
};

const loadShows = async (nextPage = 1) => {
  const currentRequest = ++requestId;
  const append = nextPage > 1;
  if (append) isLoadingMore.value = true;
  else isLoading.value = true;
  errorMessage.value = "";

  try {
    const result = await fetchVirtualShows(region, scope.value, nextPage);
    if (currentRequest !== requestId) return;
    shows.value = append ? [...shows.value, ...result.items] : result.items;
    page.value = result.page;
    total.value = result.total;
    hasMore.value = result.hasMore;
  } catch (error) {
    if (currentRequest === requestId) {
      errorMessage.value =
        error instanceof Error ? error.message : "Virtual shows could not be loaded.";
    }
  } finally {
    if (currentRequest === requestId) {
      isLoading.value = false;
      isLoadingMore.value = false;
    }
  }
};

const selectScope = (nextScope: VirtualShowScope) => {
  if (scope.value === nextScope) return;
  scope.value = nextScope;
  shows.value = [];
  failedPrimaryImages.value = new Set();
  failedImages.value = new Set();
  void loadShows();
};

const openDetails = (show: VirtualShowSummary) => {
  selectedShow.value = show;
  dialogOpen.value = true;
};

onMounted(() => loadShows());
</script>

<template>
  <ShowLayout watermark-text="VIRTUAL SHOW" :content-scrollable="false">
    <section class="flex h-full min-h-0 flex-col text-white">
      <div class="shrink-0">
        <div class="mb-4 flex items-end justify-between gap-3">
          <div>
            <div class="mb-1 flex items-center gap-2 text-cyan-100/80">
              <Radio class="h-4 w-4" :stroke-width="2.5" />
              <span class="text-xs font-black uppercase tracking-[0.18em]">Select show</span>
            </div>
            <h1 class="text-2xl font-black leading-none drop-shadow-sm">Virtual Shows</h1>
          </div>
          <span v-if="!isLoading && !errorMessage" class="text-xs font-bold text-white/55">
            {{ total }} {{ scope === "active" ? "available" : "past" }}
          </span>
        </div>

        <div
          class="mb-4 grid grid-cols-2 gap-1 rounded-full border border-white/15 bg-[#202d54]/55 p-1 shadow-inner backdrop-blur-md"
          aria-label="Virtual show filters"
        >
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 active:scale-[0.98]"
            :class="scope === 'active' ? 'bg-cyan-200 text-[#17213f] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'"
            :aria-pressed="scope === 'active'"
            @click="selectScope('active')"
          >
            <Sparkles class="h-4 w-4" :stroke-width="2" />
            Current
          </button>
          <button
            type="button"
            class="flex items-center justify-center gap-2 rounded-full px-3 py-2 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 active:scale-[0.98]"
            :class="scope === 'archive' ? 'bg-cyan-200 text-[#17213f] shadow-md' : 'text-white/70 hover:bg-white/10 hover:text-white'"
            :aria-pressed="scope === 'archive'"
            @click="selectScope('archive')"
          >
            <History class="h-4 w-4" :stroke-width="2" />
            Archive
          </button>
        </div>
      </div>

      <div class="virtual-show-scrollbar min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-2 pb-20">
        <div v-if="isLoading" aria-label="Loading virtual shows" class="flex flex-col items-center gap-4 py-1">
          <div
            v-for="item in 5"
            :key="item"
            class="h-28 animate-pulse rounded-xl border border-white/10 bg-white/10"
            :class="item % 2 === 0 ? 'w-[88%]' : 'w-[78%]'"
          />
        </div>

        <div
          v-else-if="errorMessage"
          class="rounded-xl border border-white/15 bg-[#202d54]/65 p-6 text-center backdrop-blur-md"
        >
          <p class="font-black">Shows are unavailable</p>
          <p class="mt-2 text-sm leading-6 text-white/65">{{ errorMessage }}</p>
          <button
            type="button"
            class="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#17213f] transition hover:bg-cyan-100 active:scale-[0.98]"
            @click="loadShows()"
          >
            <RefreshCw class="h-4 w-4" :stroke-width="2" />
            Retry
          </button>
        </div>

        <div
          v-else-if="!shows.length"
          class="rounded-xl border border-white/15 bg-[#202d54]/65 p-8 text-center backdrop-blur-md"
        >
          <Radio class="mx-auto h-7 w-7 text-cyan-100/70" :stroke-width="1.8" />
          <p class="mt-3 font-black">No {{ scope === "active" ? "current" : "archived" }} shows</p>
          <p class="mt-1 text-sm text-white/60">Check again after the next data update.</p>
        </div>

        <div v-else class="flex flex-col items-center gap-4 py-1">
          <button
            v-for="show in shows"
            :key="show.id"
            type="button"
            class="group relative inline-flex h-28 w-fit max-w-[calc(100%-1rem)] shrink-0 overflow-visible rounded-xl text-left outline-none transition-transform duration-200 ease-out hover:scale-[1.025] focus-visible:scale-[1.025] focus-visible:ring-2 focus-visible:ring-cyan-200 active:scale-[1.01]"
            :aria-label="`View details for ${show.name}`"
            @click="openDetails(show)"
          >
            <img
              v-if="!failedImages.has(show.id)"
              :src="getImageUrl(show)"
              :alt="show.name"
              loading="lazy"
              class="block h-28 w-auto max-w-full rounded-xl border border-white/20 object-contain shadow-[0_10px_28px_rgba(19,25,68,0.28)]"
              @error="handleImageError(show)"
            />
            <div
              v-else
              class="flex h-28 w-80 max-w-full items-center justify-center rounded-xl border border-white/15 bg-[linear-gradient(135deg,#25345f,#17213f)] px-4 text-center text-xs font-black text-white/55"
            >
              {{ show.name }}
            </div>

            <div
              class="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-xl bg-[#111b35]/90 px-3 py-2 opacity-0 shadow-[0_-8px_20px_rgba(11,20,48,0.24)] backdrop-blur-md transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              <div class="flex items-start justify-between gap-3">
                <p class="min-w-0 truncate text-xs font-black text-white">{{ show.name }}</p>
                <span
                  class="shrink-0 text-[10px] font-black"
                  :class="show.status === 'live' ? 'text-cyan-200' : 'text-white/70'"
                >
                  {{ getStatusLabel(show) }}
                </span>
              </div>
              <div class="mt-1 flex items-center gap-3 text-[10px] font-semibold text-white/55">
                <span class="flex items-center gap-1">
                  <CalendarDays class="h-3 w-3" :stroke-width="2" />
                  {{ show.scheduleCount }} showtimes
                </span>
                <span class="flex items-center gap-1">
                  <UsersRound class="h-3 w-3" :stroke-width="2" />
                  {{ show.castCount }} cast
                </span>
              </div>
            </div>
          </button>
        </div>

        <button
          v-if="hasMore"
          type="button"
          class="mx-auto mt-4 flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-black text-white/85 transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 active:scale-[0.99] disabled:cursor-wait disabled:opacity-60"
          :disabled="isLoadingMore"
          @click="loadShows(page + 1)"
        >
          {{ isLoadingMore ? "Loading shows..." : "Load more" }}
        </button>
      </div>
    </section>
  </ShowLayout>

  <VirtualShowDetailDialog
    :show="selectedShow"
    v-model:open="dialogOpen"
  />
</template>

<style scoped>
.virtual-show-scrollbar {
  scrollbar-color: rgb(255 255 255 / 0.34) rgb(255 255 255 / 0.06);
  scrollbar-width: thin;
}

.virtual-show-scrollbar::-webkit-scrollbar {
  width: 7px;
}

.virtual-show-scrollbar::-webkit-scrollbar-track {
  border-radius: 999px;
  background: rgb(255 255 255 / 0.06);
}

.virtual-show-scrollbar::-webkit-scrollbar-thumb {
  border: 2px solid transparent;
  border-radius: 999px;
  background: rgb(255 255 255 / 0.34);
  background-clip: padding-box;
}

@media (prefers-reduced-motion: reduce) {
  .virtual-show-scrollbar *,
  .virtual-show-scrollbar *::before,
  .virtual-show-scrollbar *::after {
    scroll-behavior: auto !important;
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
