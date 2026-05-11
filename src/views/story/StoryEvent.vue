<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { getRegion } from "@/utils/cookie";
import SubpageHeader from "@/components/layout/SubpageHeader.vue";
import CommonButton from "@/components/common/CommonButton.vue";
import StoryEventDetailDialog from "@/components/features/story/StoryEventDetailDialog.vue";
import LazyImage from "@/components/common/LazyImage.vue";


interface EventStory {
  id: number;
  eventId: number;
  outline: string;
  bannerGameCharacterUnitId: number;
  assetbundleName: string;
}

const events = ref<EventStory[]>([]);
const isLoading = ref(true);
const errorMsg = ref("");
const selectedIndex = ref(0);
const dialogOpen = ref(false);

const region = getRegion();

const selectedEvent = computed(() => events.value[selectedIndex.value] || null);

const getBannerUrl = (event: EventStory) => {
  return `/storage/sekai-${region}-assets/event_story/${event.assetbundleName}/screen_image/banner_event_story.webp`;
};

const getBgUrl = (event: EventStory) => {
  return `/storage/sekai-${region}-assets/event/${event.assetbundleName}/screen/bg.webp`;
};

const getLogoUrl = (event: EventStory) => {
  return `/storage/sekai-${region}-assets/event/${event.assetbundleName}/logo/logo.webp`;
};

onMounted(async () => {
  try {
    const dbSuffix = region === "jp" ? "" : `-${region}`;
    const res = await axios.get<EventStory[]>(
      `/sekai-world/sekai-master-db${dbSuffix}-diff/eventStories.json`,
    );
    // Sort events by ID descending so newest are first
    events.value = res.data.slice().sort((a, b) => b.id - a.id);
  } catch (err) {
    errorMsg.value = "Failed to load story list.";
    console.error(err);
  } finally {
    isLoading.value = false;
  }
});
</script>

<template>
  <div class="relative w-full h-screen overflow-hidden bg-[#0d1a2e]">
    <!-- Background image for the selected event -->
    <div
      class="absolute inset-0 bg-cover bg-center transition-all duration-700 ease-in-out"
      :style="{
        backgroundImage: selectedEvent ? `url(${getBgUrl(selectedEvent)})` : '',
      }"
    ></div>

    <!-- Soft gradient overlay to ensure text/UI visibility -->
    <div
      class="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent"
    ></div>

    <!-- SubpageHeader for navigation -->
    <SubpageHeader class="z-50 relative" />

    <div
      v-if="isLoading"
      class="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <span class="text-white/80 font-bold animate-pulse text-xl tracking-widest">
        LOADING...
      </span>
    </div>

    <div
      v-else-if="errorMsg"
      class="absolute inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <p class="text-red-400 font-semibold text-center text-xl">{{ errorMsg }}</p>
    </div>

    <div v-else class="fixed top-0 flex w-full h-full">
      <!-- LEFT COLUMN: Scrollable list of events -->
      <div
        class="w-[340px] flex flex-col h-full shrink-0 z-20 relative bg-gradient-to-r from-black/60 to-transparent"
      >
        <div
          class="flex-1 overflow-y-auto custom-scrollbar px-8 py-4 flex flex-col gap-5 relative left-10"
        >
          <button
            v-for="(event, index) in events"
            :key="event.id"
            @click="selectedIndex = index"
            class="relative aspect-[21/9] shrink-0 rounded-xl overflow-hidden shadow-md border-[4px] transition-all duration-300 outline-none group"
            :class="
              selectedIndex === index
                ? 'border-pink-400 scale-[1.03] w-[260px]'
                : 'border-transparent hover:border-white/50 hover:scale-[1.01] w-[220px]'
            "
          >
            <!-- Banner image -->
            <LazyImage
              :src="getBannerUrl(event)"
              class="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />

            <div
              class="absolute top-0 left-0 bg-pink-500/90 text-white text-[10px] font-black px-3 py-0.5 rounded-br-lg shadow-sm tracking-wide"
            >
              Event Story
            </div>
          </button>
        </div>
      </div>

      <!-- RIGHT COLUMN: Selected Event Focus View -->
      <div class="flex-1 relative pointer-events-none h-full p-8 flex flex-col justify-end">
        <!-- Top Right Meta (Story Completion mock) -->
        <div
          class="fixed top-2 right-20 z-50 flex items-center gap-4 bg-gray-900/60 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 shadow-lg pointer-events-auto transition-all"
        >
          <div class="flex flex-col text-right">
            <span class="text-white/70 text-xs font-bold tracking-widest">Story Completion</span>
            <span class="text-white text-2xl font-black">0.0%</span>
          </div>
          <div class="w-px h-8 bg-white/20"></div>
          <div class="flex items-center gap-2">
            <div
              class="w-10 h-6 bg-teal-400/20 border border-teal-300 rounded flex items-center justify-center shadow-inner"
            >
              <span class="text-teal-300 text-[10px] font-black">TICKET</span>
            </div>
            <div class="flex gap-1" v-for="i in 8" :key="i">
              <div class="w-4 h-5 bg-white/20 rounded shadow-inner"></div>
            </div>
          </div>
        </div>

        <div class="w-full flex justify-between items-end relative bottom-16 pl-8 pr-12">
          <!-- Logo element mapping to bottom-ish left of right area -->
          <div
            class="filter drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)] transition-all duration-500 hover:scale-105 pointer-events-auto origin-bottom-left cursor-pointer"
          >
            <img
              v-if="selectedEvent"
              :src="getLogoUrl(selectedEvent)"
              class="h-[140px] lg:h-[200px] object-contain max-w-[600px]"
            />
          </div>

          <!-- Select Button -->
          <div class="pointer-events-auto">
            <CommonButton
              v-if="selectedEvent"
              type="text"
              color="teal"
              size="lg"
              @click="dialogOpen = true"
            >
              Select
            </CommonButton>
          </div>
        </div>
      </div>
    </div>

    <!-- Story Event Detail Dialog -->
    <StoryEventDetailDialog
      v-if="selectedEvent"
      :event-id="selectedEvent.eventId"
      v-model:open="dialogOpen"
    />
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background-color: red;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(255, 255, 255, 0.6);
}
</style>
