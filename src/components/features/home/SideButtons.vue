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
} from "lucide-vue-next";
import { ref, watch, onMounted, computed } from "vue";
import axios from "axios";
import { getCookie, setCookie } from "../../../utils/cookie";
import { useLive2DSelection } from "@/composables/useLive2DSelection";
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

const isSilent = ref(getCookie("sekai-bgm-silent", "false") === "true");

watch(isSilent, (newVal) => {
  setCookie("sekai-bgm-silent", newVal ? "true" : "false");
});

function toggleBgm() {
  isSilent.value = !isSilent.value;
}

const { selection, applySelection } = useLive2DSelection();
const modelList = ref<Live2DModelEntry[]>([]);
const searchQuery = ref("");
const isDialogOpen = ref(false);
const pendingModel = ref<Live2DModelEntry | null>(null);
const pendingMotion = ref("");
const pendingExpression = ref("");
const modelOptions = ref<Live2DModelOptions>({ motions: [], expressions: [] });
const isLoadingOptions = ref(false);
const modelListError = ref("");
const modelOptionsError = ref("");
let optionsRequestId = 0;

const filteredModels = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return modelList.value;
  return modelList.value.filter(
    (model) =>
      model.modelName.toLowerCase().includes(q) ||
      model.modelBase.toLowerCase().includes(q),
  );
});

const fetchModelList = async () => {
  try {
    const res = await axios.get<Live2DModelEntry[]>(
      "/storage/sekai-live2d-assets/live2d/model_list.json",
    );
    modelList.value = res.data;
  } catch (err) {
    modelListError.value = "The Live2D model list could not be loaded.";
    console.error("Failed to fetch model list", err);
  }
};

onMounted(fetchModelList);

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
  const currentModel =
    modelList.value.find(
      (model) =>
        model.modelPath === selection.value.modelPath &&
        model.modelFile === selection.value.modelFile,
    ) ?? { ...selection.value };
  void selectModel(currentModel, true);
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
              <p v-if="modelListError" class="py-8 text-center text-sm text-destructive">
                {{ modelListError }}
              </p>
              <div class="flex flex-col gap-2">
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
                v-if="!modelListError && filteredModels.length === 0"
                class="py-8 text-center text-sm text-muted-foreground"
              >
                No matching models.
              </p>
            </div>
          </section>

          <section class="flex flex-col min-h-0 bg-muted/20">
            <div class="flex-1 overflow-y-auto p-5 space-y-5">
              <div>
                <p class="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Selected model
                </p>
                <p class="mt-1 text-sm font-semibold break-all">
                  {{ pendingModel?.modelName || "Choose a model" }}
                </p>
              </div>

              <div v-if="isLoadingOptions" class="flex items-center gap-2 text-sm text-muted-foreground">
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

    <!-- List button -->
    <CommonButton type="icon">
      <ListOrdered class="h-5 w-5" />
    </CommonButton>
  </div>
</template>
