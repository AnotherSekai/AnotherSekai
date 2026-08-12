<script setup lang="ts">
import {
  Check,
  Clapperboard,
  ListOrdered,
  LoaderCircle,
  Search,
  Sparkles,
  User,
  Volume2,
  VolumeX,
} from "@lucide/vue";
import { computed, ref, shallowRef, watch } from "vue";
import { refDebounced, useElementSize } from "@vueuse/core";
import axios from "axios";
import { getCookie, setCookie } from "../../../utils/cookie";
import { useLive2DSelection } from "@/composables/useLive2DSelection";
import { useVirtualGrid } from "@/composables/useVirtualGrid";
import {
  loadLive2DModelOptions,
  type Live2DModelEntry,
  type Live2DModelOptions,
} from "@/utils/live2d";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import CommonButton from "@/components/common/CommonButton.vue";

type TitleTab = "kizuna" | "others";

interface OtherTitle {
  kind: "others";
  id: number;
  name: string;
  baseImageUrl: string;
  overlayImageUrl: string;
  frameImageUrl: string;
}

interface KizunaTitle {
  kind: "kizuna";
  id: number;
  name: string;
  wordName: string;
  background: string;
  characterImageUrls: [string, string];
  wordImageUrl: string;
  frameImageUrl: string;
}

type DisplayTitle = OtherTitle | KizunaTitle;

interface TitleCatalog {
  kizuna: KizunaTitle[];
  others: OtherTitle[];
}

const isSilent = ref(getCookie("sekai-bgm-silent", "false") === "true");

watch(isSilent, (newVal) => {
  setCookie("sekai-bgm-silent", newVal ? "true" : "false");
});

function toggleBgm() {
  isSilent.value = !isSilent.value;
}

const { selection, applySelection } = useLive2DSelection();
const modelList = shallowRef<Live2DModelEntry[]>([]);
const searchQuery = ref("");
const isDialogOpen = ref(false);
const pendingModel = ref<Live2DModelEntry | null>(null);
const pendingMotion = ref("");
const pendingExpression = ref("");
const modelOptions = ref<Live2DModelOptions>({ motions: [], expressions: [] });
const isLoadingOptions = ref(false);
const modelListError = ref("");
const isLoadingModels = ref(false);
const hasLoadedModels = ref(false);
const modelOptionsError = ref("");
let optionsRequestId = 0;

const titleDialogOpen = ref(false);
const activeTitleTab = ref<TitleTab>("kizuna");
const titleSearch = ref("");
const isLoadingTitles = ref(false);
const hasLoadedTitles = ref(false);
const titleListError = ref("");
const kizunaTitles = shallowRef<KizunaTitle[]>([]);
const otherTitles = shallowRef<OtherTitle[]>([]);
const titlesScrollRef = ref<HTMLElement | null>(null);
const debouncedTitleSearch = refDebounced(titleSearch, 120);

const filteredTitles = computed<DisplayTitle[]>(() => {
  const source: DisplayTitle[] =
    activeTitleTab.value === "kizuna" ? kizunaTitles.value : otherTitles.value;
  const query = debouncedTitleSearch.value.trim().toLowerCase();
  if (!query) return source;

  return source.filter((title) => {
    const searchableName = title.kind === "kizuna" ? `${title.name} ${title.wordName}` : title.name;
    return searchableName.toLowerCase().includes(query);
  });
});

const { width: titlesScrollWidth } = useElementSize(titlesScrollRef);
const titleGridColumns = computed(() => {
  if (titlesScrollWidth.value >= 1040) return 4;
  if (titlesScrollWidth.value >= 760) return 3;
  if (titlesScrollWidth.value >= 500) return 2;
  return 1;
});

const { visibleItems, totalHeight, offsetY } = useVirtualGrid<DisplayTitle>({
  containerRef: titlesScrollRef,
  items: filteredTitles,
  columns: titleGridColumns,
  gap: 12,
  bufferRows: 4,
});

const filteredModels = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return modelList.value;
  return modelList.value.filter(
    (model) =>
      model.modelName.toLowerCase().includes(q) || model.modelBase.toLowerCase().includes(q),
  );
});

const fetchModelList = async () => {
  if (isLoadingModels.value || hasLoadedModels.value) return;
  isLoadingModels.value = true;
  modelListError.value = "";
  try {
    const res = await axios.get<Live2DModelEntry[]>(
      "/storage/sekai-live2d-assets/live2d/model_list.json",
    );
    if (!Array.isArray(res.data)) throw new Error("Invalid Live2D model list response.");
    modelList.value = res.data;
    hasLoadedModels.value = true;
  } catch (err) {
    modelListError.value = "The Live2D model list could not be loaded.";
    console.error("Failed to fetch model list", err);
  } finally {
    isLoadingModels.value = false;
  }
};

function handleTitleImageError(event: Event) {
  const image = event.currentTarget as HTMLImageElement | null;
  if (image) image.style.display = "none";
}

async function fetchTitles() {
  isLoadingTitles.value = true;
  titleListError.value = "";

  try {
    const region = getCookie("sekai-region", "en");
    const response = await axios.get<TitleCatalog>("/api/titles", { params: { region } });
    if (!Array.isArray(response.data.kizuna) || !Array.isArray(response.data.others)) {
      throw new Error("Invalid title catalog response.");
    }
    kizunaTitles.value = response.data.kizuna;
    otherTitles.value = response.data.others;
    hasLoadedTitles.value = true;
  } catch (error) {
    titleListError.value = "Titles could not be loaded. Please try again.";
    console.error("Failed to load titles", error);
  } finally {
    isLoadingTitles.value = false;
  }
}

async function selectModel(model: Live2DModelEntry, restoreSelection = false) {
  pendingModel.value = model;
  pendingMotion.value = "";
  pendingExpression.value = "";
  modelOptions.value = { motions: [], expressions: [] };
  modelOptionsError.value = "";
  isLoadingOptions.value = true;
  const requestId = ++optionsRequestId;

  try {
    const options = await loadLive2DModelOptions(model);
    if (requestId !== optionsRequestId) return;
    modelOptions.value = options;

    if (restoreSelection) {
      pendingMotion.value = options.motions.some((motion) => motion.Name === selection.value.motion)
        ? selection.value.motion
        : "";
      pendingExpression.value = options.expressions.some(
        (expression) => expression.Name === selection.value.expression,
      )
        ? selection.value.expression
        : "";
    }
  } catch (error) {
    if (requestId !== optionsRequestId) return;
    modelOptionsError.value = "Motions and expressions could not be loaded for this model.";
    console.error(`Failed to load Live2D options for ${model.modelName}`, error);
  } finally {
    if (requestId === optionsRequestId) isLoadingOptions.value = false;
  }
}

watch(isDialogOpen, (open) => {
  if (!open) return;
  searchQuery.value = "";
  void fetchModelList();
  const currentModel = modelList.value.find(
    (model) =>
      model.modelPath === selection.value.modelPath &&
      model.modelFile === selection.value.modelFile,
  ) ?? { ...selection.value };
  void selectModel(currentModel, true);
});

watch(titleDialogOpen, (open) => {
  if (!open) return;
  titleSearch.value = "";
  if (!hasLoadedTitles.value && !isLoadingTitles.value) void fetchTitles();
});

watch([activeTitleTab, titleSearch], () => {
  if (titlesScrollRef.value) titlesScrollRef.value.scrollTop = 0;
});

function applyLive2D() {
  if (!pendingModel.value || isLoadingOptions.value) return;
  applySelection({
    ...pendingModel.value,
    motion: pendingMotion.value,
    expression: pendingExpression.value,
  });
  isDialogOpen.value = false;
}
</script>

<template>
  <div class="absolute right-2.5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5">
    <!-- Music Toggler -->
    <CommonButton type="icon" @click="toggleBgm">
      <VolumeX v-if="isSilent" class="h-5 w-5" />
      <Volume2 v-else class="h-5 w-5" />
    </CommonButton>

    <Dialog v-model:open="isDialogOpen">
      <DialogTrigger as-child>
        <CommonButton type="icon">
          <User class="h-5 w-5" />
        </CommonButton>
      </DialogTrigger>
      <DialogContent
        class="z-[200] max-w-4xl h-[min(82vh,760px)] flex flex-col p-0 gap-0 overflow-hidden"
      >
        <DialogHeader class="px-6 pt-6 pb-4 shrink-0 border-b">
          <DialogTitle>Live2D Model</DialogTitle>
          <DialogDescription>
            Choose a model, motion, and expression for the Live2D character.
          </DialogDescription>
        </DialogHeader>

        <div class="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_300px] flex-1 min-h-0">
          <section class="flex flex-col min-h-0 border-b md:border-b-0 md:border-r">
            <div class="px-5 py-3 shrink-0">
              <div class="relative">
                <Search
                  class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
                />
                <input
                  v-model="searchQuery"
                  placeholder="Search models..."
                  class="w-full h-9 rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div class="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
              <div
                v-if="isLoadingModels"
                class="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground"
              >
                <LoaderCircle class="h-4 w-4 animate-spin" />
                Loading models…
              </div>
              <p v-else-if="modelListError" class="py-8 text-center text-sm text-destructive">
                {{ modelListError }}
              </p>
              <div v-else class="flex flex-col gap-2">
                <button
                  v-for="model in filteredModels"
                  :key="`${model.modelPath}/${model.modelFile}`"
                  :class="[
                    'relative flex w-full items-center gap-3 rounded-lg border p-3 pr-9 text-left transition-colors',
                    pendingModel?.modelPath === model.modelPath &&
                    pendingModel?.modelFile === model.modelFile
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-accent/50 border-border',
                  ]"
                  @click="selectModel(model)"
                >
                  <Check
                    v-if="
                      selection.modelPath === model.modelPath &&
                      selection.modelFile === model.modelFile
                    "
                    class="absolute top-2 right-2 h-3.5 w-3.5 text-primary"
                  />
                  <span class="min-w-0 flex-1 truncate text-xs font-semibold">
                    {{ model.modelName }}
                  </span>
                </button>
              </div>
              <p
                v-if="!isLoadingModels && !modelListError && filteredModels.length === 0"
                class="py-8 text-center text-sm text-muted-foreground"
              >
                No matching models.
              </p>
            </div>
          </section>

          <section class="flex flex-col min-h-0 bg-muted/20">
            <div class="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <p
                  class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Selected model
                </p>
                <p class="mt-1 text-sm font-semibold break-all">
                  {{ pendingModel?.modelName || "Choose a model" }}
                </p>
              </div>

              <div
                v-if="isLoadingOptions"
                class="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <LoaderCircle class="h-4 w-4 animate-spin" />
                Loading motions and expressions…
              </div>

              <p v-else-if="modelOptionsError" class="text-sm text-destructive">
                {{ modelOptionsError }}
              </p>

              <template v-else-if="pendingModel">
                <label class="block space-y-2">
                  <span class="flex items-center gap-2 text-xs font-semibold">
                    <Clapperboard class="h-4 w-4 text-primary" />
                    Motion
                    <span class="ml-auto font-normal text-muted-foreground">
                      {{ modelOptions.motions.length }}
                    </span>
                  </span>
                  <select
                    v-model="pendingMotion"
                    class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">None</option>
                    <option
                      v-for="motion in modelOptions.motions"
                      :key="motion.Name"
                      :value="motion.Name"
                    >
                      {{ motion.Name }}
                    </option>
                  </select>
                </label>

                <label class="block space-y-2">
                  <span class="flex items-center gap-2 text-xs font-semibold">
                    <Sparkles class="h-4 w-4 text-primary" />
                    Expression
                    <span class="ml-auto font-normal text-muted-foreground">
                      {{ modelOptions.expressions.length }}
                    </span>
                  </span>
                  <select
                    v-model="pendingExpression"
                    class="w-full h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">None</option>
                    <option
                      v-for="expression in modelOptions.expressions"
                      :key="expression.Name"
                      :value="expression.Name"
                    >
                      {{ expression.Name }}
                    </option>
                  </select>
                </label>
              </template>
            </div>

            <div class="shrink-0 border-t p-5">
              <Button
                class="w-full"
                :disabled="!pendingModel || isLoadingOptions || !!modelOptionsError"
                @click="applyLive2D"
              >
                Apply Live2D
              </Button>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Titles list -->
    <Dialog v-model:open="titleDialogOpen">
      <DialogTrigger as-child>
        <CommonButton type="icon" aria-label="View all titles">
          <ListOrdered class="h-5 w-5" />
        </CommonButton>
      </DialogTrigger>

      <DialogContent
        class="z-[200] h-[min(88dvh,820px)] w-[calc(100vw-1.5rem)] max-w-6xl grid-rows-[auto_auto_minmax(0,1fr)] gap-0 overflow-hidden p-0"
      >
        <DialogHeader class="shrink-0 border-b px-5 pb-4 pt-5 pr-14 sm:px-6 sm:pt-6">
          <DialogTitle class="flex items-center gap-2 text-xl"> Titles </DialogTitle>
          <DialogDescription>
            Browse every Kizuna and standard title available for your selected region.
          </DialogDescription>
        </DialogHeader>

        <div
          class="flex shrink-0 flex-col gap-3 border-b bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:px-6"
        >
          <div
            class="grid grid-cols-2 rounded-lg bg-muted p-1 sm:w-[300px]"
            role="tablist"
            aria-label="Title categories"
          >
            <button
              type="button"
              role="tab"
              :aria-selected="activeTitleTab === 'kizuna'"
              :class="[
                'flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors active:scale-[0.98]',
                activeTitleTab === 'kizuna'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="activeTitleTab = 'kizuna'"
            >
              Kizuna
              <span class="text-xs font-normal text-muted-foreground">
                {{ kizunaTitles.length.toLocaleString() }}
              </span>
            </button>
            <button
              type="button"
              role="tab"
              :aria-selected="activeTitleTab === 'others'"
              :class="[
                'flex h-9 items-center justify-center gap-2 rounded-md px-3 text-sm font-semibold transition-colors active:scale-[0.98]',
                activeTitleTab === 'others'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="activeTitleTab = 'others'"
            >
              <Trophy class="h-4 w-4" />
              Others
              <span class="text-xs font-normal text-muted-foreground">
                {{ otherTitles.length.toLocaleString() }}
              </span>
            </button>
          </div>

          <label class="relative min-w-0 flex-1">
            <span class="sr-only">Search titles</span>
            <Search
              class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              v-model="titleSearch"
              type="search"
              placeholder="Search titles..."
              class="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
        </div>

        <div
          v-if="isLoadingTitles"
          class="grid min-h-0 grid-cols-1 content-start gap-3 overflow-hidden p-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 sm:p-6"
          aria-label="Loading titles"
        >
          <div
            v-for="index in 12"
            :key="index"
            class="h-[126px] animate-pulse rounded-xl border bg-card p-3"
          >
            <div class="h-20 rounded-lg bg-muted" />
            <div class="mt-3 h-3 w-2/3 rounded bg-muted" />
          </div>
        </div>

        <div
          v-else-if="titleListError"
          class="flex min-h-0 flex-col items-center justify-center gap-4 px-6 text-center"
        >
          <Trophy class="h-10 w-10 text-muted-foreground" />
          <div>
            <p class="font-semibold">Unable to load titles</p>
            <p class="mt-1 text-sm text-muted-foreground">{{ titleListError }}</p>
          </div>
          <Button variant="outline" @click="fetchTitles">Try again</Button>
        </div>

        <div
          v-else-if="filteredTitles.length === 0"
          class="flex min-h-0 flex-col items-center justify-center gap-3 px-6 text-center"
        >
          <Search class="h-9 w-9 text-muted-foreground" />
          <div>
            <p class="font-semibold">No matching titles</p>
            <p class="mt-1 text-sm text-muted-foreground">Try a different search.</p>
          </div>
        </div>

        <div
          v-else
          ref="titlesScrollRef"
          class="min-h-0 overflow-y-auto overscroll-contain bg-muted/10 p-4 sm:p-6"
        >
          <div class="relative" :style="{ height: `${Math.max(0, totalHeight)}px` }">
            <div
              class="absolute inset-x-0 top-0 grid gap-3"
              :style="{
                gridTemplateColumns: `repeat(${titleGridColumns}, minmax(0, 1fr))`,
                transform: `translateY(${offsetY}px)`,
              }"
            >
              <article
                v-for="entry in visibleItems"
                :key="`${entry.item.kind}-${entry.item.id}`"
                data-virtual-item
                class="h-[126px] overflow-hidden rounded-xl border bg-card p-3 shadow-sm"
              >
                <div
                  class="relative mx-auto aspect-[19/4] w-full max-w-[380px] overflow-hidden rounded-[999px] bg-muted/50"
                  :style="
                    entry.item.kind === 'kizuna' ? { background: entry.item.background } : undefined
                  "
                >
                  <template v-if="entry.item.kind === 'others'">
                    <img
                      v-if="entry.item.baseImageUrl"
                      :src="entry.item.baseImageUrl"
                      :alt="`${entry.item.name} title`"
                      class="absolute inset-0 h-full w-full object-fill"
                      loading="lazy"
                      @error="handleTitleImageError"
                    />
                    <img
                      v-if="entry.item.overlayImageUrl"
                      :src="entry.item.overlayImageUrl"
                      alt=""
                      class="absolute inset-0 z-[1] h-full w-full object-fill"
                      loading="lazy"
                      @error="handleTitleImageError"
                    />
                  </template>

                  <template v-else>
                    <img
                      v-if="entry.item.characterImageUrls[0]"
                      :src="entry.item.characterImageUrls[0]"
                      alt=""
                      class="absolute -bottom-[15%] left-[4%] h-[130%] w-auto max-w-[34%] object-contain"
                      loading="lazy"
                      @error="handleTitleImageError"
                    />
                    <img
                      v-if="entry.item.characterImageUrls[1]"
                      :src="entry.item.characterImageUrls[1]"
                      alt=""
                      class="absolute -bottom-[15%] right-[4%] h-[130%] w-auto max-w-[34%] object-contain"
                      loading="lazy"
                      @error="handleTitleImageError"
                    />
                    <img
                      v-if="entry.item.wordImageUrl"
                      :src="entry.item.wordImageUrl"
                      :alt="entry.item.wordName"
                      class="absolute left-1/2 top-1/2 z-[1] max-h-[72%] max-w-[48%] -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-sm"
                      loading="lazy"
                      @error="handleTitleImageError"
                    />
                  </template>

                  <img
                    :src="entry.item.frameImageUrl"
                    alt=""
                    class="pointer-events-none absolute inset-0 z-[2] h-full w-full object-fill"
                  />
                </div>

                <p class="mt-2 truncate text-center text-xs font-semibold" :title="entry.item.name">
                  {{ entry.item.name }}
                </p>
              </article>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
