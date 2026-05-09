<script setup lang="ts">
import { ref, watch } from "vue";
import axios from "axios";
import { getRegion } from "../../../utils/cookie";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EventStoryEpisode {
  id: number;
  eventStoryId: number;
  episodeNo: number;
  title: string;
  assetbundleName: string;
  scenarioId: string;
}

interface EventStory {
  id: number;
  eventId: number;
  outline: string;
  bannerGameCharacterUnitId: number;
  assetbundleName: string;
  eventStoryEpisodes: EventStoryEpisode[];
}

const props = defineProps<{
  eventId: number;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const region = getRegion();
const eventStory = ref<EventStory | null>(null);
const isLoading = ref(false);
const errorMsg = ref("");

const getEpisodeThumbnailUrl = (episode: EventStoryEpisode) => {
  const episodeNum = String(episode.episodeNo).padStart(2, "0");
  return `/storage/sekai-${region}-assets/event_story/${episode.assetbundleName.slice(0, -3)}/episode_image/${episode.assetbundleName}.webp`;
};

watch(
  () => props.open,
  async (open) => {
    if (open && props.eventId) {
      isLoading.value = true;
      errorMsg.value = "";
      try {
        const dbSuffix = region === "jp" ? "" : `-${region}`;
        const res = await axios.get<EventStory[]>(
          `/sekai-world/sekai-master-db${dbSuffix}-diff/eventStories.json`,
        );
        const event = res.data.find((e) => e.eventId === props.eventId);
        if (!event) {
          errorMsg.value = "Event not found.";
          return;
        }
        eventStory.value = event;
      } catch (err) {
        errorMsg.value = "Failed to load event details.";
        console.error(err);
      } finally {
        isLoading.value = false;
      }
    } else if (!open) {
      eventStory.value = null;
    }
  },
);
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
      <DialogHeader class="px-6 pt-6 pb-2 shrink-0">
        <DialogTitle class="text-xl font-bold">Event Story</DialogTitle>
        <DialogDescription
          v-if="eventStory"
          class="text-sm text-muted-foreground line-clamp-3"
        >
          {{ eventStory.outline }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="px-6 pb-6">
            <div v-if="isLoading" class="py-12 text-center">
              <span class="text-muted-foreground animate-pulse text-sm font-medium">
                Loading...
              </span>
            </div>
            <div
              v-else-if="errorMsg"
              class="py-12 text-center text-sm text-destructive font-medium"
            >
              {{ errorMsg }}
            </div>
            <div
              v-else-if="eventStory"
              class="grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div
                v-for="episode in eventStory.eventStoryEpisodes"
                :key="episode.id"
                class="group flex items-start gap-4 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div
                  class="shrink-0 w-24 h-14 rounded-md overflow-hidden bg-muted border"
                >
                  <img
                    :src="getEpisodeThumbnailUrl(episode)"
                    class="w-full h-full object-cover"
                    loading="lazy"
                    :alt="episode.title"
                  />
                </div>
                <div class="flex flex-col justify-center min-w-0 py-0.5">
                  <span
                    class="text-sm font-semibold truncate group-hover:text-primary transition-colors"
                  >
                    {{ episode.title }}
                  </span>
                  <span class="text-xs text-muted-foreground">
                    Episode {{ episode.episodeNo }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
    </DialogContent>
  </Dialog>
</template>
