<script setup lang="ts">
import { ref } from "vue";
import { Globe, Music, Plus, Zap, Settings, Menu, Diamond } from "lucide-vue-next";
import CommonButton from "@/components/common/CommonButton.vue";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getCookie, setCookie } from "@/utils/cookie";

const emit = defineEmits<{
  "open-menu": [];
}>();

const rank = ref(Number(getCookie("sekai-user-rank", "1")));
const crystal = ref(Number(getCookie("sekai-user-crystal", "-10000")));
const energy = ref(Number(getCookie("sekai-user-energy", "50/20")));
const isModifyOpen = ref(false);

const saveData = () => {
  setCookie("sekai-rank", String(rank.value));
  setCookie("sekai-crystal", String(crystal.value));
  setCookie("sekai-energy", String(energy.value));
  isModifyOpen.value = false;
};
</script>

<template>
  <header class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3">
    <!-- Left: Location -->
    <div class="flex items-center gap-2">
      <RouterLink to="/worldmap">
        <CommonButton type="icon" color="white">
          <Globe class="h-5 w-5" />
        </CommonButton>
      </RouterLink>
      <div
        class="flex items-center gap-1.5 bg-primary/40 backdrop-blur-md rounded-full px-3.5 py-2 shadow-lg"
      >
        <span class="text-white text-sm font-semibold">Another Sekai</span>
      </div>
    </div>

    <!-- Right: Stats & Actions -->
    <div class="flex items-center gap-1.5">
      <!-- Rank -->
      <div
        class="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-3 py-2 shadow-lg"
      >
        <Music class="h-3.5 w-3.5 text-pink-400" />
        <span class="text-amber-300 text-xs font-bold">Rank</span>
        <span class="text-white text-sm font-bold ml-0.5">{{ rank }}</span>
      </div>

      <!-- Currency -->
      <div
        class="flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full px-3 py-2 shadow-lg"
      >
        <Diamond class="h-3.5 w-3.5 text-purple-200 fill-blue-200" />
        <span class="text-white text-sm font-bold tabular-nums">{{ crystal }}</span>
        

        <AlertDialog>
          <AlertDialogTrigger as-child>
            <button class="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center hover:bg-cyan-300 transition-colors shadow-sm">
              <Plus class="h-3 w-3 text-white" :stroke-width="3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent class="z-[200]">
            <AlertDialogHeader>
              <AlertDialogTitle>Just for you!</AlertDialogTitle>
              <AlertDialogDescription>
                You know what will appear here right?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Yep</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <!-- Stamina -->
      <div
        class="flex items-center gap-1 bg-black/40 backdrop-blur-md rounded-full px-3 py-2 shadow-lg"
      >
        <Zap class="h-3.5 w-3.5 text-green-400 fill-green-400" />
        <span class="text-white text-sm font-bold tabular-nums">{{ energy }}</span>
        

        <Dialog v-model:open="isModifyOpen">
          <DialogTrigger as-child>
            <button
              class="w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center hover:bg-cyan-300 transition-colors shadow-sm"
            >
            <Settings class="h-3 w-3 text-white" :stroke-width="3" />
          </button>
          </DialogTrigger>
          <DialogContent class="z-[200]">
            <DialogHeader>
              <DialogTitle>Modify</DialogTitle>
              <DialogDescription>
                Modify Rank, Crystal and Energy.
              </DialogDescription>
            </DialogHeader>
            <div class="grid gap-4 py-2">
              <div class="grid grid-cols-4 items-center gap-4">
                <label class="text-right text-sm font-medium">Rank</label>
                <input
                  v-model.number="rank"
                  type="number"
                  class="col-span-3 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <label class="text-right text-sm font-medium">Crystal</label>
                <input
                  v-model.number="crystal"
                  type="number"
                  class="col-span-3 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div class="grid grid-cols-4 items-center gap-4">
                <label class="text-right text-sm font-medium">Energy</label>
                <input
                  v-model="energy"
                  class="col-span-3 h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
            <DialogFooter>
              <Button @click="saveData">Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <!-- Menu -->
      <CommonButton type="icon" color="white" @click="emit('open-menu')">
        <Menu class="h-5 w-5" />
      </CommonButton>
    </div>
  </header>
</template>
