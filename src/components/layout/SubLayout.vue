<!-- Layout with live2d -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import * as PIXI from "pixi.js";
import { Live2DModel, MotionPreloadStrategy } from "@sekai-world/pixi-live2d-display-mulmotion";
import SubpageHeader from "./SubpageHeader.vue";
import BackgroundLayer from "../common/BackgroundLayer.vue";
import { useLive2DSelection, type Live2DSelection } from "@/composables/useLive2DSelection";
import { loadLive2DModelData } from "@/utils/live2d";

declare global {
  interface Window {
    PIXI: typeof PIXI;
  }
}
window.PIXI = PIXI;

const props = defineProps<{
  watermarkText?: string;
}>();

const live2dContainer = ref<HTMLElement | null>(null);
let app: PIXI.Application | null = null;
let model: Live2DModel | null = null;
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

async function replaceLive2DModel(nextSelection: Live2DSelection) {
  if (!app) return;
  const requestId = ++loadRequestId;

  try {
    const { data, options } = await loadLive2DModelData(nextSelection);
    const nextModel = await Live2DModel.from(data, {
      autoInteract: false,
      motionPreload: MotionPreloadStrategy.NONE,
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

    const motionIndex = options.motions.findIndex(
      (motion) => motion.Name === nextSelection.motion,
    );
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

watch(
  selection,
  (nextSelection) => {
    void replaceLive2DModel({ ...nextSelection });
  },
  { deep: true },
);

onMounted(() => {
  if (!live2dContainer.value) return;

  app = new PIXI.Application({
    view: document.createElement("canvas"),
    resizeTo: live2dContainer.value,
    backgroundAlpha: 0,
  });
  live2dContainer.value.appendChild(app.view as HTMLCanvasElement);

  resizeObserver = new ResizeObserver(updateLive2DLayout);
  resizeObserver.observe(live2dContainer.value);
  void replaceLive2DModel({ ...selection.value });
});

onUnmounted(() => {
  isUnmounted = true;
  loadRequestId += 1;
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (app) {
    app.destroy(true, { children: true });
  }
  model = null;
  app = null;
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
        <div class="flex-1 overflow-y-auto px-4 pt-14 pb-20 relative z-10">
          <slot></slot>
        </div>
      </div>
    </BackgroundLayer>
  </div>
</template>
