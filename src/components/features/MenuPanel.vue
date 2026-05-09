<script setup lang="ts">
import { X, Globe, Image as ImageIcon, Bug } from "lucide-vue-next";
import { ref, watch } from "vue";
import { getCookie, setCookie } from "../../utils/cookie";
import CommonButton from "../common/CommonButton.vue";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const regions = ["en", "jp", "cn", "tc", "kr"] as const;
type Region = (typeof regions)[number];

const currentVal = getCookie("sekai-region", "en");
const currentRegion = ref<Region>(
  regions.includes(currentVal as Region) ? (currentVal as Region) : "en",
);

// Watcher to sync cookie
watch(currentRegion, (newRegion) => {
  setCookie("sekai-region", newRegion, 365);
});

function switchRegion(r: Region) {
  if (currentRegion.value === r) return;
  currentRegion.value = r;
  emit("close");
  window.location.reload();
}

const backgrounds = Array.from({ length: 99 }, (_, i) => `bg_a${String(i + 1).padStart(6, "0")}`);
const currentBg = ref(getCookie("sekai-bg", "") || "");

const cookiesList = ref<{ key: string; value: string }[]>([]);
const updateCookies = () => {
  if (typeof document === "undefined") return;
  cookiesList.value = document.cookie
    .split(";")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [key, ...rest] = c.split("=");
      return { key: key || "", value: decodeURIComponent(rest.join("=")) };
    });
};

function switchBg(bg: string) {
  if (currentBg.value === bg) return;
  setCookie("sekai-bg", bg, 365);
  currentBg.value = bg;
  emit("close");
  window.location.reload();
}
</script>

<template>
  <!-- Backdrop -->
  <Transition name="fade">
    <div
      v-if="open"
      class="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
      @click="emit('close')"
    />
  </Transition>

  <!-- Slide Panel -->
  <Transition name="slide">
    <div
      v-if="open"
      class="fixed top-0 right-0 bottom-0 z-[100] w-[52%] max-w-[520px] bg-black/30 backdrop-blur-md shadow-2xl overflow-y-auto"
    >
      <!-- Close button -->
      <button
        class="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow-md transition-colors"
        @click="emit('close')"
      >
        <X class="h-5 w-5 text-gray-700" />
      </button>

      <!-- Panel Content Wrapper -->
      <div class="px-3 pt-14 pb-6 space-y-6">
        <!-- Region Switcher -->
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <Globe class="h-4 w-4 text-emerald-500" />
            <span class="text-xs font-black text-gray-700 tracking-wide">REGION</span>
          </div>
          <div class="flex gap-2 w-full">
            <CommonButton
              v-for="r in regions"
              :key="r"
              size="sm"
              :color="currentRegion === r ? 'teal' : 'white'"
              @click="switchRegion(r)"
            >
              {{ r }}
            </CommonButton>
          </div>
        </div>

        <!-- Background Switcher -->
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <ImageIcon class="h-4 w-4 text-pink-500" />
            <span class="text-xs font-black text-gray-700 tracking-wide">BACKGROUND</span>
          </div>
          <div class="grid grid-cols-3 gap-2 w-full max-h-[300px] overflow-y-auto pr-1">
            <button
              v-for="bg in backgrounds"
              :key="bg"
              class="relative aspect-video rounded-lg overflow-hidden border-2 transition-all shadow-sm group bg-gray-100 flex-shrink-0"
              :class="
                currentBg === bg
                  ? 'border-pink-400 scale-[1.03] shadow-md shadow-pink-500/20 z-10'
                  : 'border-transparent hover:border-gray-300'
              "
              @click="switchBg(bg)"
            >
              <img
                loading="lazy"
                :src="`/storage/sekai-jp-assets/scenario/background/${bg}/${bg}.webp`"
                class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                @error="(e) => ((e.target as HTMLImageElement).style.visibility = 'hidden')"
                @load="(e) => ((e.target as HTMLImageElement).style.visibility = 'visible')"
              />
              <div v-if="currentBg === bg" class="absolute inset-0 bg-pink-500/20"></div>
            </button>
          </div>
        </div>

        <!-- Debug Cookies Button -->
        <Dialog >
          <DialogTrigger as-child>
            <Button color="white" type="text" class="w-full" @click="updateCookies">
              <Bug class="w-4 h-4" />
              DEBUG COOKIES
            </Button>
          </DialogTrigger>
          <DialogContent class="z-[200] max-w-lg max-h-[80vh] flex flex-col p-0 gap-2 overflow-hidden">
            <DialogHeader class="px-6 pt-6 pb-2 shrink-0">
              <DialogTitle>Cookie Debug</DialogTitle>
              <DialogDescription>
                🍪 list
              </DialogDescription>
            </DialogHeader>
                <div class="max-h-[50vh] overflow-y-auto mt-4 px-6 pb-6 space-y-2 text-left ">
                  <div
                    v-for="cookie in cookiesList"
                    :key="cookie.key"
                    class="flex flex-col bg-gray-50 gap-2 p-3 rounded-xl border break-all"
                  >
                    <span class="font-black text-gray-700">{{ cookie.key }}:</span>
                    <span class="text-gray-500 font-mono text-sm ml-2 block mt-1">{{
                      cookie.value
                    }}</span>
                  </div>
                  <div v-if="cookiesList.length === 0" class="text-gray-400 text-center py-4">
                    No cookies found.
                  </div>
                </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(100%);
}
</style>
