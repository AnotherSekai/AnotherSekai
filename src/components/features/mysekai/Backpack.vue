<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import axios from "axios";
import {
  Pickaxe,
  TreePine,
  Diamond,
  Flower2,
  Package,
  type LucideIcon,
} from "lucide-vue-next";
import { getCookie } from "@/utils/cookie";

interface MySekaiTool {
  id: number;
  seq: number;
  mysekaiToolType: string;
  toolLevel: number;
  name: string;
  description: string;
  assetbundleName: string;
  spriteName: string;
  attackPower: number;
  maxDurability: number;
  coolTimeMicroSeconds: number;
}

interface MySekaiMaterial {
  id: number;
  seq: number;
  mysekaiMaterialType: string;
  name: string;
  description: string;
  mysekaiMaterialRarityType: string;
  iconAssetbundleName: string;
  modelAssetbundleName: string;
  mysekaiSiteIds: number[];
}

interface DisplayItem {
  id: number;
  name: string;
  description: string;
  category: string;
  type: "tool" | "material";
  rarity?: string;
  attackPower?: number;
  maxDurability?: number;
  coolTimeMicroSeconds?: number;
  assetbundleName?: string;
  iconAssetbundleName?: string;
  thumbnailUrl: string;
}

interface TabConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  filter: (item: DisplayItem) => boolean;
}

const allItems = ref<DisplayItem[]>([]);
const isLoading = ref(true);
const activeTab = ref("tools");

const tabs: TabConfig[] = [
  {
    id: "tools",
    name: "Tools",
    icon: Pickaxe,
    filter: (item) => item.type === "tool",
  },
  {
    id: "wood",
    name: "Lumber",
    icon: TreePine,
    filter: (item) => item.category === "wood",
  },
  {
    id: "mineral",
    name: "Minerals",
    icon: Diamond,
    filter: (item) => item.category === "mineral",
  },
  {
    id: "plant",
    name: "Plants",
    icon: Flower2,
    filter: (item) => item.category === "plant",
  },
  {
    id: "other",
    name: "Other",
    icon: Package,
    filter: (item) =>
      ["junk", "game_character", "tone", "other"].includes(item.category),
  },
];

const filteredItems = computed(() => {
  const tab = tabs.find((t) => t.id === activeTab.value);
  if (!tab) return allItems.value;
  return allItems.value.filter(tab.filter);
});

// Tooltip state
const tooltipItem = ref<DisplayItem | null>(null);
const tooltipPos = ref({ x: 0, y: 0 });
const failedImages = ref<Record<number, boolean>>({});

// Held item (Minecraft-style cursor pickup)
const heldItem = ref<DisplayItem | null>(null);
const heldPos = ref({ x: 0, y: 0 });

const showTooltip = (item: DisplayItem, e: MouseEvent) => {
  if (heldItem.value) return;
  tooltipItem.value = item;
  tooltipPos.value = { x: e.clientX + 12, y: e.clientY + 12 };
};

const moveTooltip = (e: MouseEvent) => {
  if (heldItem.value) return;
  tooltipPos.value = { x: e.clientX + 12, y: e.clientY + 12 };
};

const hideTooltip = () => {
  tooltipItem.value = null;
};

const handleItemClick = (item: DisplayItem, e: MouseEvent) => {
  if (heldItem.value) {
    heldItem.value = null;
    return;
  }
  if (!failedImages.value[item.id]) {
    heldItem.value = item;
    heldPos.value = { x: e.clientX, y: e.clientY };
  }
};

const moveHeldItem = (e: MouseEvent) => {
  if (!heldItem.value) return;
  heldPos.value = { x: e.clientX, y: e.clientY };
};

onMounted(async () => {
  window.addEventListener("mousemove", moveHeldItem);
  try {
    const region = getCookie("sekai-region", "en");
    const dbSuffix = region === "jp" ? "" : `-${region}`;

    const [toolsRes, materialsRes] = await Promise.all([
      axios.get<MySekaiTool[]>(
        `/sekai-world/sekai-master-db${dbSuffix}-diff/mysekaiTools.json`
      ),
      axios.get<MySekaiMaterial[]>(
        `/sekai-world/sekai-master-db${dbSuffix}-diff/mysekaiMaterials.json`
      ),
    ]);

    const tools: DisplayItem[] = toolsRes.data.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description,
      category: t.mysekaiToolType,
      type: "tool",
      attackPower: t.attackPower,
      maxDurability: t.maxDurability,
      coolTimeMicroSeconds: t.coolTimeMicroSeconds,
      assetbundleName: t.assetbundleName,
      thumbnailUrl: `/storage/sekai-jp-assets/mysekai/thumbnail/tool/${t.assetbundleName}.webp`,
    }));

    const materials: DisplayItem[] = materialsRes.data.map((m) => ({
      id: m.id + 10000,
      name: m.name,
      description: m.description,
      category: m.mysekaiMaterialType,
      type: "material",
      rarity: m.mysekaiMaterialRarityType,
      iconAssetbundleName: m.iconAssetbundleName,
      thumbnailUrl: `/storage/sekai-jp-assets/mysekai/thumbnail/material/${m.iconAssetbundleName}.webp`,
    }));

    allItems.value = [...tools, ...materials];
  } catch (err) {
    console.error("Failed to load MySekai items:", err);
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener("mousemove", moveHeldItem);
});
</script>

<template>
  <div class="w-full max-w-3xl mx-auto select-none">
    <div
      class="relative bg-[#C6C6C6] rounded-sm p-1"
      style="
        box-shadow:
          inset 2px 2px 0px #ffffff,
          inset -2px -2px 0px #555555,
          0 4px 20px rgba(0, 0, 0, 0.4);
      "
    >
      <!-- Tabs -->
      <div class="flex px-1 pt-1 gap-0.5">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          class="relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors"
          :class="
            activeTab === tab.id
              ? 'bg-[#C6C6C6] text-[#3a3a3a]'
              : 'bg-[#a0a0a0] text-[#555555] hover:bg-[#b0b0b0]'
          "
          style="
            box-shadow:
              inset 1px 1px 0px #ffffff,
              inset -1px 0px 0px #777777;
          "
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" class="w-3.5 h-3.5" />
          <span>{{ tab.name }}</span>
        </button>
      </div>

      <!-- Content area -->
      <div
        class="bg-[#C6C6C6] p-3"
        style="
          box-shadow:
            inset 2px 2px 0px #555555,
            inset -2px -2px 0px #ffffff;
        "
      >
        <div v-if="isLoading" class="flex items-center justify-center h-48">
          <span class="text-[#555555] font-bold text-sm animate-pulse"
            >Loading items...</span
          >
        </div>

        <div
          v-else
          class="grid grid-cols-9 gap-1"
          @mouseleave="hideTooltip"
        >
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="relative aspect-square bg-[#8B8B8B] flex items-center justify-center cursor-pointer transition-colors hover:bg-[#9B9B9B] group"
            style="
              box-shadow:
                inset 2px 2px 0px #555555,
                inset -2px -2px 0px #ffffff;
            "
            @mouseenter="showTooltip(item, $event)"
            @mousemove="moveTooltip($event)"
            @click="handleItemClick(item, $event)"
          >
            <!-- Item thumbnail -->
            <div
              class="w-10 h-10 rounded flex items-center justify-center overflow-hidden bg-gradient-to-br from-white/20 to-black/10"
            >
              <img
                v-if="!failedImages[item.id]"
                :src="item.thumbnailUrl"
                :alt="item.name"
                class="w-full h-full object-contain"
                loading="lazy"
                @error="failedImages[item.id] = true"
              />
              <span
                v-if="failedImages[item.id]"
                class="text-[10px] font-bold text-white/80 leading-none text-center px-0.5"
              >
                {{ item.name.slice(0, 2).toUpperCase() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tooltip (fixed to viewport) -->
    <div
      v-if="tooltipItem"
      class="fixed z-[100] pointer-events-none max-w-xs"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      <div
        class="bg-[#100010]/95 text-white px-3 py-2 rounded-sm text-sm leading-relaxed"
        style="box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.5)"
      >
        <div class="font-bold text-yellow-300 mb-0.5">{{ tooltipItem.name }}</div>
        <div
          v-if="tooltipItem.rarity"
          class="text-[11px] text-purple-300 mb-0.5 capitalize"
        >
          {{ tooltipItem.rarity.replace("rarity_", "Rarity ") }}
        </div>
        <div class="text-gray-300 text-xs whitespace-pre-line">
          {{ tooltipItem.description }}
        </div>

        <div v-if="tooltipItem.type === 'tool'" class="mt-1.5 space-y-0.5 text-[11px]">
          <div class="text-gray-400">
            Attack: <span class="text-blue-300">{{ tooltipItem.attackPower }}</span>
          </div>
          <div class="text-gray-400">
            Durability:
            <span class="text-green-300">{{ tooltipItem.maxDurability }}</span>
          </div>
          <div class="text-gray-400">
            Cooldown:
            <span class="text-cyan-300">{{ tooltipItem.coolTimeMicroSeconds }}μs</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Held item following cursor (Minecraft style) -->
    <div
      v-if="heldItem"
      class="fixed z-[110] pointer-events-none"
      :style="{ left: heldPos.x - 16 + 'px', top: heldPos.y - 16 + 'px' }"
    >
      <div class="w-8 h-8 flex items-center justify-center">
        <img
          :src="heldItem.thumbnailUrl"
          :alt="heldItem.name"
          class="w-full h-full object-contain drop-shadow-md"
          draggable="false"
        />
      </div>
    </div>
  </div>
</template>
