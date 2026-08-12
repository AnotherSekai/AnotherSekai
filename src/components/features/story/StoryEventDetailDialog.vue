<script setup lang="ts">
import { getRegion } from "../../../utils/cookie";
import type { EventStory, EventStoryEpisode } from "@/utils/story";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const props = defineProps<{
  event: EventStory;
  open: boolean;
}>();

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
}>();

const region = getRegion();

const getEpisodeThumbnailUrl = (episode: EventStoryEpisode) => {
  return `/storage/sekai-${region}-assets/event_story/${episode.assetbundleName.slice(0, -3)}/episode_image/${episode.assetbundleName}.webp`;
};
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-3xl max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
      <DialogHeader class="px-6 pt-6 pb-2 shrink-0">
        <DialogTitle class="text-xl font-bold">Event Story</DialogTitle>
        <DialogDescription v-if="props.event" class="text-sm text-muted-foreground line-clamp-3">
          {{ props.event.outline }}
        </DialogDescription>
      </DialogHeader>

      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="px-6 pb-6">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
              v-for="episode in props.event.eventStoryEpisodes"
              :key="episode.id"
              class="group flex items-start gap-4 p-3 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 transition-colors cursor-pointer"
            >
              <div class="shrink-0 w-24 h-14 rounded-md overflow-hidden bg-muted border">
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
                <span class="text-xs text-muted-foreground"> Episode {{ episode.episodeNo }} </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
