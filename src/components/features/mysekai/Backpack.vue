<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, shallowRef } from "vue";
import axios from "axios";
import {
  Blocks,
  CakeSlice,
  ChevronLeft,
  ChevronRight,
  Diamond,
  Flower2,
  Music2,
  PackageOpen,
  Pickaxe,
  Recycle,
  TreePine,
  UsersRound,
  type LucideIcon,
} from "@lucide/vue";
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

interface MySekaiItem {
  id: number;
  seq: number;
  mysekaiItemType: string;
  name: string;
  description: string;
  iconAssetbundleName: string;
}

interface DisplayItem {
  id: string;
  name: string;
  description: string;
  category: string;
  type: "tool" | "material" | "item";
  rarity?: string;
  attackPower?: number;
  maxDurability?: number;
  coolTimeMicroSeconds?: number;
  thumbnailUrl: string;
}

interface TabConfig {
  id: string;
  name: string;
  icon: LucideIcon;
  filter: (item: DisplayItem) => boolean;
}

const TABS_PER_PAGE = 5;
const ITEMS_PER_PAGE = 45;

const tabs: TabConfig[] = [
  {
    id: "all",
    name: "All",
    icon: Blocks,
    filter: () => true,
  },
  {
    id: "items",
    name: "Items",
    icon: PackageOpen,
    filter: (item) => item.type === "item",
  },
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
    id: "game_character",
    name: "Characters",
    icon: UsersRound,
    filter: (item) => item.category === "game_character",
  },
  {
    id: "birthday_party",
    name: "Birthday",
    icon: CakeSlice,
    filter: (item) => item.category === "birthday_party",
  },
  {
    id: "junk",
    name: "Junk",
    icon: Recycle,
    filter: (item) => item.category === "junk",
  },
  {
    id: "tone",
    name: "Tone",
    icon: Music2,
    filter: (item) => item.category === "tone",
  },
];

const allItems = shallowRef<DisplayItem[]>([]);
const isLoading = ref(true);
const loadError = ref<string | null>(null);
const activeTab = ref("all");
const activeTabPage = ref(0);
const activeItemPage = ref(0);

const totalTabPages = Math.ceil(tabs.length / TABS_PER_PAGE);

const visibleTabs = computed(() => {
  const start = activeTabPage.value * TABS_PER_PAGE;
  return tabs.slice(start, start + TABS_PER_PAGE);
});

const activeTabConfig = computed(() => tabs.find((tab) => tab.id === activeTab.value) ?? tabs[0]);

const filteredItems = computed(() => allItems.value.filter(activeTabConfig.value.filter));

const totalItemPages = computed(() =>
  Math.max(1, Math.ceil(filteredItems.value.length / ITEMS_PER_PAGE)),
);

const visibleItemSlots = computed<Array<DisplayItem | null>>(() => {
  const start = activeItemPage.value * ITEMS_PER_PAGE;
  const pageItems = filteredItems.value.slice(start, start + ITEMS_PER_PAGE);
  return [
    ...pageItems,
    ...Array.from<DisplayItem | null>({ length: ITEMS_PER_PAGE - pageItems.length }).fill(null),
  ];
});

const tooltipItem = ref<DisplayItem | null>(null);
const tooltipPos = ref({ x: 0, y: 0 });
const failedImages = ref<Record<string, boolean>>({});

const heldItem = ref<DisplayItem | null>(null);
const heldPos = ref({ x: 0, y: 0 });
let pointerRafId: number | null = null;
let requestController: AbortController | null = null;

const schedulePointerUpdate = (event: MouseEvent, target: "tooltip" | "held") => {
  if (pointerRafId !== null) return;
  const { clientX, clientY } = event;
  pointerRafId = requestAnimationFrame(() => {
    pointerRafId = null;
    if (target === "held" && heldItem.value) {
      heldPos.value = { x: clientX, y: clientY };
    } else if (target === "tooltip" && tooltipItem.value && !heldItem.value) {
      tooltipPos.value = { x: clientX + 12, y: clientY + 12 };
    }
  });
};

const showTooltip = (item: DisplayItem, event: MouseEvent) => {
  if (heldItem.value) return;
  tooltipItem.value = item;
  tooltipPos.value = { x: event.clientX + 12, y: event.clientY + 12 };
};

const showTooltipFromFocus = (item: DisplayItem, event: FocusEvent) => {
  if (heldItem.value) return;
  const target = event.currentTarget as HTMLElement;
  const bounds = target.getBoundingClientRect();
  tooltipItem.value = item;
  tooltipPos.value = { x: bounds.right + 8, y: bounds.top };
};

const moveTooltip = (event: MouseEvent) => {
  if (heldItem.value) return;
  schedulePointerUpdate(event, "tooltip");
};

const hideTooltip = () => {
  tooltipItem.value = null;
};

const releaseHeldItem = () => {
  heldItem.value = null;
  window.removeEventListener("mousemove", moveHeldItem);
};

const resetInteraction = () => {
  hideTooltip();
  releaseHeldItem();
};

const handleItemClick = (item: DisplayItem, event: MouseEvent) => {
  if (heldItem.value) {
    releaseHeldItem();
    return;
  }

  if (failedImages.value[item.id]) return;

  const target = event.currentTarget as HTMLElement;
  const bounds = target.getBoundingClientRect();
  heldItem.value = item;
  heldPos.value = {
    x: event.clientX || bounds.left + bounds.width / 2,
    y: event.clientY || bounds.top + bounds.height / 2,
  };
  window.addEventListener("mousemove", moveHeldItem, { passive: true });
};

function moveHeldItem(event: MouseEvent) {
  if (!heldItem.value) return;
  schedulePointerUpdate(event, "held");
}

const selectTab = (tabId: string) => {
  const tabIndex = tabs.findIndex((tab) => tab.id === tabId);
  if (tabIndex < 0) return;
  activeTab.value = tabId;
  activeTabPage.value = Math.floor(tabIndex / TABS_PER_PAGE);
  activeItemPage.value = 0;
  resetInteraction();
};

const changeTabPage = (direction: -1 | 1) => {
  const nextPage = Math.min(
    totalTabPages - 1,
    Math.max(0, activeTabPage.value + direction),
  );
  if (nextPage === activeTabPage.value) return;

  activeTabPage.value = nextPage;
  const firstTab = tabs[nextPage * TABS_PER_PAGE];
  if (firstTab) activeTab.value = firstTab.id;
  activeItemPage.value = 0;
  resetInteraction();
};

const changeItemPage = (direction: -1 | 1) => {
  const nextPage = Math.min(
    totalItemPages.value - 1,
    Math.max(0, activeItemPage.value + direction),
  );
  if (nextPage === activeItemPage.value) return;
  activeItemPage.value = nextPage;
  resetInteraction();
};

const getItemCategoryName = (item: DisplayItem) =>
  tabs.find((tab) => tab.id !== "all" && tab.filter(item))?.name ?? item.category;

const loadItems = async () => {
  requestController?.abort();
  const controller = new AbortController();
  requestController = controller;
  isLoading.value = true;
  loadError.value = null;

  try {
    const region = getCookie("sekai-region", "en");
    const dbSuffix = region === "jp" ? "" : `-${region}`;
    const databaseRoot = `/sekai-world/sekai-master-db${dbSuffix}-diff`;

    const [toolsResponse, materialsResponse, itemsResponse] = await Promise.all([
      axios.get<MySekaiTool[]>(`${databaseRoot}/mysekaiTools.json`, {
        signal: controller.signal,
      }),
      axios.get<MySekaiMaterial[]>(`${databaseRoot}/mysekaiMaterials.json`, {
        signal: controller.signal,
      }),
      axios.get<MySekaiItem[]>(`${databaseRoot}/mysekaiItems.json`, {
        signal: controller.signal,
      }),
    ]);

    if (
      !Array.isArray(toolsResponse.data) ||
      !Array.isArray(materialsResponse.data) ||
      !Array.isArray(itemsResponse.data)
    ) {
      throw new Error("Invalid MySekai inventory response.");
    }

    const tools: DisplayItem[] = [...toolsResponse.data]
      .sort((a, b) => a.seq - b.seq)
      .map((tool) => ({
        id: `tool-${tool.id}`,
        name: tool.name,
        description: tool.description,
        category: tool.mysekaiToolType,
        type: "tool",
        attackPower: tool.attackPower,
        maxDurability: tool.maxDurability,
        coolTimeMicroSeconds: tool.coolTimeMicroSeconds,
        thumbnailUrl: `/storage/sekai-jp-assets/mysekai/thumbnail/tool/${tool.assetbundleName}.webp`,
      }));

    const items: DisplayItem[] = [...itemsResponse.data]
      .sort((a, b) => a.seq - b.seq)
      .map((item) => ({
        id: `item-${item.id}`,
        name: item.name,
        description: item.description,
        category: item.mysekaiItemType,
        type: "item",
        thumbnailUrl: `/storage/sekai-jp-assets/mysekai/thumbnail/item/${item.iconAssetbundleName}.webp`,
      }));

    const materials: DisplayItem[] = [...materialsResponse.data]
      .sort((a, b) => a.seq - b.seq)
      .map((material) => ({
        id: `material-${material.id}`,
        name: material.name,
        description: material.description,
        category: material.mysekaiMaterialType,
        type: "material",
        rarity: material.mysekaiMaterialRarityType,
        thumbnailUrl: `/storage/sekai-jp-assets/mysekai/thumbnail/material/${material.iconAssetbundleName}.webp`,
      }));

    allItems.value = [...tools, ...items, ...materials];
    activeItemPage.value = 0;
  } catch (error) {
    if (axios.isCancel(error)) return;
    console.error("Failed to load MySekai items:", error);
    loadError.value = "Items could not be loaded from the remote storage.";
  } finally {
    if (requestController === controller) isLoading.value = false;
  }
};

onMounted(loadItems);

onUnmounted(() => {
  requestController?.abort();
  releaseHeldItem();
  if (pointerRafId !== null) cancelAnimationFrame(pointerRafId);
});
</script>

<template>
  <div class="inventory-root w-full max-w-3xl mx-auto select-none">
    <div class="tab-strip" role="tablist" aria-label="MySekai inventory categories">
      <button
        class="minecraft-button tab-page-button"
        type="button"
        :disabled="activeTabPage === 0"
        aria-label="Previous category page"
        title="Previous category page"
        @click="changeTabPage(-1)"
      >
        <ChevronLeft aria-hidden="true" />
      </button>

      <div class="tab-grid">
        <button
          v-for="tab in visibleTabs"
          :id="`inventory-tab-${tab.id}`"
          :key="tab.id"
          class="minecraft-tab"
          :class="{ active: activeTab === tab.id }"
          type="button"
          role="tab"
          :aria-selected="activeTab === tab.id"
          aria-controls="inventory-grid"
          :title="`${tab.name} (${allItems.filter(tab.filter).length})`"
          @click="selectTab(tab.id)"
        >
          <component :is="tab.icon" class="tab-icon" aria-hidden="true" />
          <span class="tab-label">{{ tab.name }}</span>
        </button>
      </div>

      <span class="tab-page-label" aria-live="polite">
        Tabs {{ activeTabPage + 1 }} / {{ totalTabPages }}
      </span>

      <button
        class="minecraft-button tab-page-button"
        type="button"
        :disabled="activeTabPage >= totalTabPages - 1"
        aria-label="Next category page"
        title="Next category page"
        @click="changeTabPage(1)"
      >
        <ChevronRight aria-hidden="true" />
      </button>
    </div>

    <div class="inventory-shell">
      <div
        id="inventory-grid"
        class="inventory-frame"
        role="tabpanel"
        :aria-labelledby="`inventory-tab-${activeTab}`"
      >
        <div v-if="isLoading" class="inventory-grid" aria-label="Loading items" aria-busy="true">
          <div v-for="slot in ITEMS_PER_PAGE" :key="slot" class="inventory-slot slot-loading" />
        </div>

        <div v-else-if="loadError" class="inventory-message" role="alert">
          <PackageOpen class="message-icon" aria-hidden="true" />
          <p>{{ loadError }}</p>
          <button class="minecraft-button retry-button" type="button" @click="loadItems">
            Try again
          </button>
        </div>

        <div
          v-else-if="filteredItems.length === 0"
          class="inventory-grid"
          aria-label="No items in this category"
        >
          <div v-for="slot in ITEMS_PER_PAGE" :key="slot" class="inventory-slot" />
        </div>

        <div v-else class="inventory-grid" @mouseleave="hideTooltip">
          <button
            v-for="(item, slotIndex) in visibleItemSlots"
            :key="item?.id ?? `empty-${activeItemPage}-${slotIndex}`"
            class="inventory-slot"
            type="button"
            :disabled="!item"
            :aria-label="item?.name"
            @mouseenter="item && showTooltip(item, $event)"
            @mousemove="item && moveTooltip($event)"
            @mouseleave="item && hideTooltip()"
            @focus="item && showTooltipFromFocus(item, $event)"
            @blur="hideTooltip"
            @click="item && handleItemClick(item, $event)"
          >
            <template v-if="item">
              <img
                v-if="!failedImages[item.id]"
                :src="item.thumbnailUrl"
                :alt="item.name"
                class="item-thumbnail"
                loading="lazy"
                draggable="false"
                @error="failedImages[item.id] = true"
              />
              <span v-else class="item-fallback" aria-hidden="true">
                {{ item.name.slice(0, 2).toUpperCase() }}
              </span>
            </template>
          </button>
        </div>
      </div>

      <div class="inventory-footer" aria-live="polite">
        <span class="item-count">
          {{ isLoading ? "Loading items..." : loadError ? "Unavailable" : `${filteredItems.length} items` }}
        </span>

        <div class="item-page-controls">
          <button
            class="minecraft-button"
            type="button"
            :disabled="isLoading || !!loadError || activeItemPage === 0"
            aria-label="Previous item page"
            title="Previous item page"
            @click="changeItemPage(-1)"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span class="item-page-label">
            Page {{ activeItemPage + 1 }} / {{ totalItemPages }}
          </span>
          <button
            class="minecraft-button"
            type="button"
            :disabled="isLoading || !!loadError || activeItemPage >= totalItemPages - 1"
            aria-label="Next item page"
            title="Next item page"
            @click="changeItemPage(1)"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="tooltipItem"
      class="item-tooltip fixed z-[100] pointer-events-none max-w-xs"
      :style="{ left: tooltipPos.x + 'px', top: tooltipPos.y + 'px' }"
    >
      <div class="tooltip-name">{{ tooltipItem.name }}</div>
      <div class="tooltip-category">{{ getItemCategoryName(tooltipItem) }}</div>
      <div v-if="tooltipItem.rarity" class="tooltip-rarity">
        {{ tooltipItem.rarity.replace("rarity_", "Rarity ") }}
      </div>
      <div class="tooltip-description">{{ tooltipItem.description }}</div>

      <div v-if="tooltipItem.type === 'tool'" class="tool-stats">
        <div>
          Attack: <span class="stat-attack">{{ tooltipItem.attackPower }}</span>
        </div>
        <div>
          Durability: <span class="stat-durability">{{ tooltipItem.maxDurability }}</span>
        </div>
        <div>
          Cooldown: <span class="stat-cooldown">{{ tooltipItem.coolTimeMicroSeconds }}μs</span>
        </div>
      </div>
    </div>

    <div
      v-if="heldItem"
      class="fixed z-[110] pointer-events-none"
      :style="{ left: heldPos.x - 16 + 'px', top: heldPos.y - 16 + 'px' }"
    >
      <img
        :src="heldItem.thumbnailUrl"
        :alt="heldItem.name"
        class="held-thumbnail"
        draggable="false"
      />
    </div>
  </div>
</template>

<style scoped>
.inventory-root {
  color: #3a3a3a;
}

.tab-strip {
  display: flex;
  min-width: 0;
  align-items: end;
  gap: 3px;
  padding: 0 4px;
}

.tab-grid {
  display: grid;
  min-width: 0;
  flex: 1;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 2px;
}

.minecraft-tab,
.minecraft-button {
  border: 0;
  border-radius: 2px;
  background: #a0a0a0;
  color: #484848;
  box-shadow:
    inset 2px 2px 0 #e7e7e7,
    inset -2px -2px 0 #5b5b5b;
  text-shadow: 1px 1px 0 rgb(255 255 255 / 35%);
}

.minecraft-tab {
  display: flex;
  min-width: 0;
  height: 40px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
  overflow: hidden;
  font-size: 0.7rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.minecraft-tab:hover:not(.active),
.minecraft-button:hover:not(:disabled) {
  background: #b3b3b3;
}

.minecraft-tab.active {
  height: 43px;
  background: #c6c6c6;
  color: #2f2f2f;
  box-shadow:
    inset 2px 2px 0 #fff,
    inset -2px 0 0 #696969;
}

.minecraft-tab:active,
.minecraft-button:active:not(:disabled) {
  transform: translateY(1px);
  box-shadow:
    inset 2px 2px 0 #595959,
    inset -2px -2px 0 #dedede;
}

.minecraft-tab:focus-visible,
.minecraft-button:focus-visible,
.inventory-slot:focus-visible {
  z-index: 1;
  outline: 2px solid #fff56b;
  outline-offset: -3px;
}

.minecraft-button {
  display: inline-flex;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
}

.minecraft-button:disabled {
  color: #777;
  opacity: 0.55;
}

.minecraft-button > svg,
.tab-icon {
  width: 17px;
  height: 17px;
  flex: 0 0 auto;
  stroke-width: 2.4;
}

.tab-page-label {
  display: none;
  width: 52px;
  flex: 0 0 auto;
  padding-bottom: 10px;
  color: #e4e4e4;
  font-size: 0.65rem;
  font-weight: 800;
  line-height: 1.1;
  text-align: center;
  text-shadow: 1px 1px 0 #222;
}

.tab-page-button {
  margin-bottom: 3px;
}

.inventory-shell {
  position: relative;
  padding: 6px;
  border-radius: 2px;
  background: #c6c6c6;
  box-shadow:
    inset 2px 2px 0 #fff,
    inset -2px -2px 0 #555,
    0 4px 20px rgb(0 0 0 / 40%);
}

.inventory-frame {
  padding: 10px;
  background: #c6c6c6;
  box-shadow:
    inset 2px 2px 0 #555,
    inset -2px -2px 0 #fff;
}

.inventory-grid {
  display: grid;
  grid-template-columns: repeat(9, minmax(0, 1fr));
  gap: 3px;
}

.inventory-slot {
  position: relative;
  display: flex;
  min-width: 0;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 0;
  border-radius: 1px;
  padding: 5px;
  background: #8b8b8b;
  box-shadow:
    inset 2px 2px 0 #555,
    inset -2px -2px 0 #fff;
}

.inventory-slot:not(:disabled) {
  cursor: pointer;
}

.inventory-slot:hover:not(:disabled) {
  background: #9b9b9b;
}

.inventory-slot:active:not(:disabled) {
  background: #808080;
  box-shadow:
    inset 2px 2px 0 #3f3f3f,
    inset -1px -1px 0 #d8d8d8;
}

.inventory-slot:disabled {
  opacity: 1;
}

.slot-loading::after {
  width: 52%;
  aspect-ratio: 1;
  border-radius: 1px;
  background: rgb(255 255 255 / 12%);
  box-shadow: inset -1px -1px 0 rgb(0 0 0 / 12%);
  content: "";
}

.item-thumbnail {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: drop-shadow(1px 2px 0 rgb(0 0 0 / 28%));
  image-rendering: auto;
}

.item-fallback {
  color: rgb(255 255 255 / 85%);
  font-size: clamp(0.48rem, 1.8vw, 0.66rem);
  font-weight: 800;
  line-height: 1;
  text-align: center;
}

.inventory-message {
  display: flex;
  min-height: 270px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  color: #4a4a4a;
  font-size: 0.8rem;
  font-weight: 800;
  text-align: center;
}

.message-icon {
  width: 34px;
  height: 34px;
  color: #656565;
}

.retry-button {
  width: auto;
  min-width: 96px;
  padding: 0 12px;
  font-size: 0.72rem;
  font-weight: 800;
}

.inventory-footer {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 7px 5px 1px;
}

.item-count,
.item-page-label {
  font-size: 0.7rem;
  font-weight: 800;
  text-shadow: 1px 1px 0 rgb(255 255 255 / 50%);
}

.item-page-controls {
  display: flex;
  align-items: center;
  gap: 7px;
}

.item-page-label {
  min-width: 76px;
  text-align: center;
}

.item-tooltip {
  padding: 8px 12px;
  border: 2px solid #2b0a48;
  border-radius: 2px;
  background: rgb(16 0 16 / 96%);
  color: #f4f4f4;
  box-shadow: 2px 2px 0 rgb(0 0 0 / 55%);
  font-size: 0.8rem;
  line-height: 1.45;
}

.tooltip-name {
  color: #fff56b;
  font-weight: 800;
}

.tooltip-category {
  color: #aaa;
  font-size: 0.66rem;
  font-weight: 700;
  text-transform: uppercase;
}

.tooltip-rarity {
  color: #d8a6ff;
  font-size: 0.68rem;
  text-transform: capitalize;
}

.tooltip-description {
  margin-top: 3px;
  color: #d1d1d1;
  font-size: 0.72rem;
  white-space: pre-line;
}

.tool-stats {
  display: grid;
  gap: 1px;
  margin-top: 7px;
  color: #a9a9a9;
  font-size: 0.68rem;
}

.stat-attack {
  color: #93c5fd;
}

.stat-durability {
  color: #86efac;
}

.stat-cooldown {
  color: #67e8f9;
}

.held-thumbnail {
  width: 32px;
  height: 32px;
  object-fit: contain;
  filter: drop-shadow(2px 3px 1px rgb(0 0 0 / 45%));
}

@media (min-width: 720px) {
  .tab-page-label {
    display: block;
  }
}

@media (max-width: 639px) {
  .tab-strip {
    gap: 2px;
    padding: 0 2px;
  }

  .minecraft-tab {
    height: 36px;
    padding: 0 4px;
  }

  .minecraft-tab.active {
    height: 39px;
  }

  .tab-label {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .inventory-shell {
    padding: 4px;
  }

  .inventory-frame {
    padding: 6px;
  }

  .inventory-grid {
    gap: 2px;
  }

  .inventory-slot {
    padding: 3px;
  }

  .inventory-footer {
    gap: 6px;
  }

  .item-page-controls {
    gap: 4px;
  }

  .item-page-label {
    min-width: 64px;
    font-size: 0.64rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .minecraft-tab,
  .minecraft-button {
    transition: none;
  }
}
</style>
