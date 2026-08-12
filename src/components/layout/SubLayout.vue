<!-- Layout with live2d -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import SubpageHeader from "./SubpageHeader.vue";
import BackgroundLayer from "../common/BackgroundLayer.vue";
import { useLive2DSelection, type Live2DSelection } from "@/composables/useLive2DSelection";
import { loadLive2DModelData } from "@/utils/live2d";

declare global {
  interface Window {
    PIXI: typeof import("pixi.js");
  }
}

type Live2DModule = typeof import("@sekai-world/pixi-live2d-display-mulmotion");

const props = defineProps<{
  watermarkText?: string;
  contentScrollable?: boolean;
}>();

const live2dContainer = ref<HTMLElement | null>(null);
let app: import("pixi.js").Application | null = null;
let model: import("@sekai-world/pixi-live2d-display-mulmotion").Live2DModel | null = null;
let live2DModule: Live2DModule | null = null;
let resizeObserver: ResizeObserver | null = null;
let loadRequestId = 0;
let isUnmounted = false;

const { selection } = useLive2DSelection();

function updateLive2DLayout() {
  if (!live2dContainer.value || !model) return;
  const width = live2dContainer.value.clientWidth;

  let baseScale = 0.26;
  let baseX = -160;

  if (width > 600) {
    const extraWidth = width - 600;
    baseScale = 0.26 + extraWidth * 0.0002;
    baseX = -160 + extraWidth * 0.5;
  }

  model.scale.set(baseScale);
  model.x = baseX;
  model.y = -160;
}

function syncRendererVisibility() {
  if (!app) return;
  if (document.hidden) app.stop();
  else app.start();
}

async function replaceLive2DModel(nextSelection: Live2DSelection) {
  if (!app || !live2DModule) return;
  const requestId = ++loadRequestId;

  try {
    const { data, options } = await loadLive2DModelData(nextSelection);
    const nextModel = await live2DModule.Live2DModel.from(data, {
      autoInteract: false,
      motionPreload: live2DModule.MotionPreloadStrategy.NONE,
    });

    if (isUnmounted || requestId !== loadRequestId || !app) {
      nextModel.destroy();
      return;
    }

    const previousModel = model;
    model = nextModel;
    app.stage.addChild(nextModel);
    updateLive2DLayout();

    if (previousModel) {
      app.stage.removeChild(previousModel);
      previousModel.destroy();
    }

    const motionIndex = options.motions.findIndex((motion) => motion.Name === nextSelection.motion);
    const expressionIndex = options.expressions.findIndex(
      (expression) => expression.Name === nextSelection.expression,
    );

    const actions: Promise<boolean>[] = [];
    if (motionIndex >= 0) actions.push(nextModel.motion("Motion", motionIndex));
    if (expressionIndex >= 0) actions.push(nextModel.motion("Expression", expressionIndex));
    void Promise.all(actions).catch((error) => {
      console.error(`Failed to apply Live2D motion for ${nextSelection.modelName}`, error);
    });
  } catch (error) {
    if (requestId === loadRequestId) {
      console.error(`Failed to load Live2D model ${nextSelection.modelName}`, error);
    }
  }
}

async function initializeLive2D() {
  const container = live2dContainer.value;
  if (!container) return;

  try {
    const pixi = await import("pixi.js");
    if (isUnmounted) return;
    window.PIXI = pixi;
    live2DModule = await import("@sekai-world/pixi-live2d-display-mulmotion");
    if (isUnmounted || !live2dContainer.value) return;

    app = new pixi.Application({
      view: document.createElement("canvas"),
      resizeTo: live2dContainer.value,
      backgroundAlpha: 0,
      powerPreference: "low-power",
    });
    live2dContainer.value.appendChild(app.view as HTMLCanvasElement);

    resizeObserver = new ResizeObserver(updateLive2DLayout);
    resizeObserver.observe(live2dContainer.value);
    document.addEventListener("visibilitychange", syncRendererVisibility);
    syncRendererVisibility();
    await replaceLive2DModel({ ...selection.value });
  } catch (error) {
    if (!isUnmounted) console.error("Failed to initialize Live2D rendering.", error);
  }
}

watch(selection, (nextSelection) => {
  void replaceLive2DModel({ ...nextSelection });
});

onMounted(() => {
  void initializeLive2D();
});

onUnmounted(() => {
  isUnmounted = true;
  loadRequestId += 1;
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  document.removeEventListener("visibilitychange", syncRendererVisibility);
  if (app) {
    app.destroy(true, { children: true });
  }
  model = null;
  app = null;
  live2DModule = null;
});
</script>

<template>
  <div class="absolute inset-0 z-10 w-screen h-screen overflow-hidden">
    <!-- Common Header -->
    <SubpageHeader />

    <!-- Background with blur and dot texture -->
    <BackgroundLayer useMask>
      <!-- Live2D Render Area (Left side) -->
      <div class="fixed top-0 bottom-0 left-0 w-[55%] pointer-events-none drop-shadow-2xl">
        <div ref="live2dContainer" class="w-full h-full pointer-events-auto cursor-pointer" />
      </div>
      <!-- Right-side content panel (phone-like card) -->
      <div
        class="absolute top-10 -bottom-32 right-10 max-w-200 left-[45%] bg-indigo-900/30 backdrop-blur-sm rounded-[40px] border border-white/20 overflow-hidden flex flex-col pointer-events-auto rotate-[5deg] origin-center shadow-2xl scale-105"
      >
        <!-- Watermark -->
        <div
          class="absolute top-2 left-4 right-4 text-[70px] font-black text-white/6 tracking-[0.15em] leading-none select-none pointer-events-none text-right"
        >
          {{ props.watermarkText || "" }}
        </div>

        <!-- Scrollable content -->
        <div
          class="flex-1 min-h-0 px-4 pt-14 pb-20 relative z-10"
          :class="props.contentScrollable === false ? 'overflow-hidden' : 'overflow-y-auto'"
        >
          <slot></slot>
        </div>
      </div>
    </BackgroundLayer>
  </div>
</template>
