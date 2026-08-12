<script setup lang="ts">
import { computed, ref, watch } from "vue";
import {
  CalendarClock,
  Clock3,
  Gift,
  Mic2,
  Music2,
  Radio,
  RefreshCw,
  UsersRound,
} from "@lucide/vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRegion } from "@/utils/cookie";
import {
  fetchVirtualShowDetail,
  type VirtualShowDetail,
  type VirtualShowSummary,
} from "@/utils/virtualShows";

const props = defineProps<{
  show: VirtualShowSummary | null;
  open: boolean;
}>();

const emit = defineEmits<{
  (event: "update:open", value: boolean): void;
}>();

const region = getRegion();
const detail = ref<VirtualShowDetail | null>(null);
const isLoading = ref(false);
const errorMessage = ref("");
let requestId = 0;

const displayShow = computed(() => detail.value ?? props.show);

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const formatDate = (timestamp: number) => dateFormatter.format(timestamp);
const formatTime = (timestamp: number) => timeFormatter.format(timestamp);

const formatType = (value: string) =>
  value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

const statusLabel = computed(() => {
  const show = displayShow.value;
  if (!show) return "";
  if (show.status === "live") return "Live now";
  if (show.status === "ended") return "Archive available";
  return show.nextScheduleAt ? `Next show ${formatTime(show.nextScheduleAt)}` : "Coming soon";
});

const loadDetail = async () => {
  if (!props.show) return;
  const currentRequest = ++requestId;
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const result = await fetchVirtualShowDetail(region, props.show.id);
    if (currentRequest === requestId) detail.value = result;
  } catch (error) {
    if (currentRequest === requestId) {
      errorMessage.value =
        error instanceof Error ? error.message : "Virtual show details could not be loaded.";
    }
  } finally {
    if (currentRequest === requestId) isLoading.value = false;
  }
};

watch(
  () => [props.open, props.show?.id] as const,
  ([open]) => {
    if (open && props.show) {
      detail.value = null;
      void loadDetail();
    } else if (!open) {
      requestId += 1;
      errorMessage.value = "";
    }
  },
);
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="[display:flex] h-[min(88dvh,760px)] flex-col overflow-hidden border-white/20 bg-[#14233c] p-0 text-white shadow-[0_28px_90px_rgba(8,20,44,0.48)] sm:max-w-3xl"
    >
      <div class="virtual-show-dialog-scrollbar min-h-0 flex-1 overflow-y-scroll">
        <div class="px-5 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
          <DialogHeader class="pr-8 text-left">
            <div class="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold text-cyan-100">
              <span class="rounded-full border border-cyan-200/25 bg-cyan-200/15 px-3 py-1">
                {{ statusLabel }}
              </span>
              <span class="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white/75">
                {{ displayShow ? formatType(displayShow.type) : "Virtual show" }}
              </span>
            </div>
            <DialogTitle class="text-2xl font-black leading-tight text-white sm:text-3xl">
              {{ displayShow?.name ?? "Virtual show" }}
            </DialogTitle>
            <DialogDescription class="mt-1 flex items-center gap-2 text-sm text-white/65">
              <CalendarClock class="h-4 w-4 shrink-0" :stroke-width="2" />
              <span v-if="displayShow">
                {{ formatDate(displayShow.startAt) }} - {{ formatDate(displayShow.endAt) }}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div v-if="isLoading" aria-label="Loading virtual show details" class="mt-6 space-y-4">
            <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div
                v-for="item in 3"
                :key="item"
                class="h-20 animate-pulse rounded-xl bg-white/10"
              />
            </div>
            <div class="h-36 animate-pulse rounded-xl bg-white/10" />
            <div class="h-28 animate-pulse rounded-xl bg-white/10" />
          </div>

          <div
            v-else-if="errorMessage"
            class="mt-6 rounded-xl border border-rose-200/20 bg-rose-300/10 p-5 text-center"
          >
            <p class="text-sm font-semibold text-rose-100">{{ errorMessage }}</p>
            <button
              type="button"
              class="mx-auto mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-black text-[#14233c] transition hover:bg-cyan-100 active:scale-[0.98]"
              @click="loadDetail"
            >
              <RefreshCw class="h-4 w-4" :stroke-width="2" />
              Retry
            </button>
          </div>

          <div v-else-if="detail" class="mt-6 space-y-6">
            <section class="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div class="rounded-xl border border-white/15 bg-white/8 p-4">
                <UsersRound class="mb-3 h-5 w-5 text-cyan-200" :stroke-width="2" />
                <p class="text-2xl font-black">{{ detail.castCount }}</p>
                <p class="text-xs font-semibold text-white/55">Performers</p>
              </div>
              <div class="rounded-xl border border-white/15 bg-white/8 p-4">
                <Clock3 class="mb-3 h-5 w-5 text-cyan-200" :stroke-width="2" />
                <p class="text-2xl font-black">{{ detail.scheduleCount }}</p>
                <p class="text-xs font-semibold text-white/55">Showtimes</p>
              </div>
              <div
                class="col-span-2 rounded-xl border border-white/15 bg-white/8 p-4 sm:col-span-1"
              >
                <Gift class="mb-3 h-5 w-5 text-cyan-200" :stroke-width="2" />
                <p class="text-2xl font-black">{{ detail.rewardCount }}</p>
                <p class="text-xs font-semibold text-white/55">Reward sets</p>
              </div>
            </section>

            <section v-if="detail.cast.length">
              <h3 class="mb-3 flex items-center gap-2 text-sm font-black text-white/85">
                <UsersRound class="h-4 w-4 text-cyan-200" :stroke-width="2" />
                Cast
              </h3>
              <div class="flex flex-wrap gap-2">
                <div
                  v-for="character in detail.cast"
                  :key="character.id"
                  class="flex items-center gap-2 rounded-full border border-white/15 bg-white/8 py-1.5 pl-1.5 pr-3"
                >
                  <span
                    class="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black text-white shadow-inner"
                    :style="{ backgroundColor: character.color }"
                  >
                    {{ character.shortName.slice(0, 2) }}
                  </span>
                  <span class="text-xs font-bold text-white/85">{{ character.name }}</span>
                </div>
              </div>
            </section>

            <section v-if="detail.schedules.length || detail.recurringSchedules.length">
              <h3 class="mb-3 flex items-center gap-2 text-sm font-black text-white/85">
                <Radio class="h-4 w-4 text-cyan-200" :stroke-width="2" />
                Showtimes
              </h3>
              <div v-if="detail.schedules.length" class="grid gap-2 sm:grid-cols-2">
                <div
                  v-for="schedule in detail.schedules"
                  :key="schedule.id"
                  class="rounded-xl border border-white/12 bg-[#0e1b31]/70 px-4 py-3"
                >
                  <p class="text-sm font-bold text-white/90">{{ formatTime(schedule.startAt) }}</p>
                  <p class="mt-1 text-xs text-white/50">Ends {{ formatTime(schedule.endAt) }}</p>
                </div>
              </div>
              <div v-else class="grid gap-2 sm:grid-cols-2">
                <div
                  v-for="schedule in detail.recurringSchedules"
                  :key="schedule.id"
                  class="rounded-xl border border-white/12 bg-[#0e1b31]/70 px-4 py-3"
                >
                  <p class="text-sm font-bold capitalize text-white/90">{{ schedule.dayOfWeek }}</p>
                  <p class="mt-1 text-xs text-white/50">
                    {{ schedule.startTime }} - {{ schedule.endTime }}
                  </p>
                </div>
              </div>
            </section>

            <section v-if="detail.setlist.length">
              <h3 class="mb-3 flex items-center gap-2 text-sm font-black text-white/85">
                <Music2 class="h-4 w-4 text-cyan-200" :stroke-width="2" />
                Setlist
              </h3>
              <div class="overflow-hidden rounded-xl border border-white/15 bg-[#0e1b31]/70">
                <div
                  v-for="step in detail.setlist"
                  :key="step.id"
                  class="flex items-center gap-3 border-b border-white/10 p-3 last:border-b-0"
                >
                  <img
                    v-if="step.jacketUrl"
                    :src="step.jacketUrl"
                    :alt="step.title ?? 'Song jacket'"
                    loading="lazy"
                    class="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                  <div
                    v-else
                    class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10"
                  >
                    <Mic2 class="h-5 w-5 text-white/55" :stroke-width="2" />
                  </div>
                  <div class="min-w-0">
                    <p class="truncate text-sm font-bold text-white/90">
                      {{ step.title ?? formatType(step.type) }}
                    </p>
                    <p class="mt-0.5 text-xs text-white/45">
                      {{ step.title ? "Music" : "Performance segment" }}
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
.virtual-show-dialog-scrollbar {
  scrollbar-color: rgb(165 243 252 / 0.42) transparent;
  scrollbar-width: thin;
}

.virtual-show-dialog-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.virtual-show-dialog-scrollbar::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgb(165 243 252 / 0.42);
}

@media (prefers-reduced-motion: reduce) {
  .animate-pulse {
    animation: none;
  }
}
</style>
