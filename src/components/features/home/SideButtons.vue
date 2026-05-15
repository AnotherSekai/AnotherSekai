<script setup lang="ts">
import { User, ListOrdered, Volume2, VolumeX, Search } from "lucide-vue-next";
import { ref, watch, onMounted, computed } from "vue";
import axios from "axios";
import { getCookie, setCookie } from "../../../utils/cookie";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


const isSilent = ref(getCookie("sekai-bgm-silent", "false") === "true");

watch(isSilent, (newVal) => {
  setCookie("sekai-bgm-silent", newVal ? "true" : "false");
});

function toggleBgm() {
  isSilent.value = !isSilent.value;
}

interface ModelEntry {
  modelName: string;
  modelBase: string;
  modelPath: string;
  modelFile: string;
}

const modelList = ref<ModelEntry[]>([]);
const searchQuery = ref("");
const selectedModel = ref(getCookie("sekai-live2d-model", "21miku_normal_3.0_f_t02"));
const isDialogOpen = ref(false);

const filteredModels = computed(() => {
  if (!searchQuery.value) return modelList.value;
  const q = searchQuery.value.toLowerCase();
  return modelList.value.filter(m => m.modelName.toLowerCase().includes(q));
});

const fetchModelList = async () => {
  try {
    const res = await axios.get<ModelEntry[]>("/storage/sekai-live2d-assets/live2d/model_list.json");
    modelList.value = res.data;
  } catch (err) {
    console.error("Failed to fetch model list", err);
  }
};

onMounted(fetchModelList);

const selectModel = (model: ModelEntry) => {
  selectedModel.value = model.modelName;
  setCookie("sekai-live2d-model", model.modelName);
  setCookie("sekai-live2d-model-path", model.modelPath);
  setCookie("sekai-live2d-model-file", model.modelFile);
  isDialogOpen.value = false;
};
</script>

<template>
  <div class="absolute right-2.5 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2.5">
    <!-- Music Toggler -->
    <button
      class="h-10 w-10 rounded-full bg-white/25 backdrop-blur-md text-black hover:bg-white/35 shadow-lg flex items-center justify-center transition-colors"
      @click="toggleBgm"
    >
      <VolumeX v-if="isSilent" class="h-5 w-5" />
      <Volume2 v-else class="h-5 w-5" />
    </button>

    <!-- Gift button -->
    

        <Dialog v-model:open="isDialogOpen">
          <DialogTrigger as-child>
            <button class="h-10 w-10 rounded-full bg-white/25 backdrop-blur-md text-black hover:bg-black/35 shadow-lg flex items-center justify-center transition-colors">
              <User class="h-5 w-5" />
            </button>
          </DialogTrigger>
          <DialogContent class="z-[200] max-w-lg max-h-[80vh] flex flex-col p-0 gap-0 overflow-hidden">
            <DialogHeader class="px-6 pt-6 pb-2 shrink-0">
              <DialogTitle>Live2D Model</DialogTitle>
              <DialogDescription>
                Select a Live2D model to display
              </DialogDescription>
            </DialogHeader>

            <div class="px-6 pb-2 shrink-0">
              <div class="relative">
                <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  v-model="searchQuery"
                  placeholder="Search models..."
                  class="w-full h-9 rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div class="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="model in filteredModels"
                  :key="model.modelName"
                  :class="[
                    'flex flex-col items-center gap-2 p-3 rounded-lg border text-left transition-colors',
                    selectedModel === model.modelName
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card hover:bg-accent/50 border-border',
                  ]"
                  @click="selectModel(model)"
                >
                  <span class="text-xs font-semibold truncate w-full text-center">{{ model.modelName }}</span>
                  <span class="text-[10px] text-muted-foreground truncate w-full text-center">{{ model.modelBase }}</span>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    <!-- List button -->
    <button
      class="h-10 w-10 rounded-full bg-white/25 backdrop-blur-md text-black hover:bg-black/35 shadow-lg flex items-center justify-center transition-colors"
    >
      <ListOrdered class="h-5 w-5" />
    </button>
  </div>
</template>
