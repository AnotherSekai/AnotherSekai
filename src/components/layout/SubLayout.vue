<!-- Layout with live2d -->
<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import * as PIXI from "pixi.js";
import { Live2DModel, MotionPreloadStrategy } from "pixi-live2d-display";
import SubpageHeader from "./SubpageHeader.vue";
import BackgroundLayer from "../common/BackgroundLayer.vue";
import { getCookie, setCookie } from "../../utils/cookie";

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

const DEFAULT_MODEL = "v2/main/21_miku/v2_21miku_night/v2_21miku_night_t01.model3.json";
const modelPath = ref(getCookie("sekai-live2d-model-path", "")+"/"+getCookie("sekai-live2d-model-file", "")) || DEFAULT_MODEL;

onMounted(async () => {
  if (live2dContainer.value) {
    const finalPath = modelPath.value;
    // Random
    // try {
    //   const res = await axios.get<ModelList[]>(
    //     `/storage/sekai-live2d-assets/live2d/model_list.json`,
    //   );
    //   if (res.data && res.data.length > 0) {
    //     const randomModel = res.data[Math.floor(Math.random() * res.data.length)];
    //     if (randomModel && randomModel.modelPath && randomModel.modelFile) {
    //       finalPath = randomModel.modelPath + "/" + randomModel.modelFile;
    //     }
    //   }
    // } catch (err) {
    //   console.error("Failed to fetch model list, using fallback.", err);
    // }
    // selectedModelPath.value = finalPath;

    app = new PIXI.Application({
      view: document.createElement("canvas"),
      resizeTo: live2dContainer.value,
      backgroundAlpha: 0,
    });
    live2dContainer.value.appendChild(app.view as HTMLCanvasElement);

    const modelUrl = `/storage/sekai-live2d-assets/live2d/model/${finalPath}`;
    console.log(modelUrl);

    // Fetch and dynamically inject motions since they aren't in the default base model json
    const rawRes = await fetch(modelUrl);
    const modelJson = await rawRes.json();

    // The url field MUST be set before calling Live2DModel.from() so the library
    // can resolve relative asset paths (textures, moc3, physics, etc.)
    modelJson.url = modelUrl;

    modelJson.FileReferences.Motions = {
      Tap: [
        {
          File: "/storage/sekai-live2d-assets/live2d/motion/v2/main/21_miku/v2_21miku_motion_base/motion/w-animal01-nod.motion3.json",
        },
      ],
    };
    modelJson.FileReferences.Expressions = [
      {
        Name: "smile",
        File: "/storage/sekai-live2d-assets/live2d/motion/v1/main/01_ichika/01ichika_motion_base/facial/face_smile_04.motion3.json",
      },
    ];

    // Initialize with autoInteract: false to fix "manager.on is not a function" in PIXI v7
    model = await Live2DModel.from(modelJson, {
      autoInteract: false,
      motionPreload: MotionPreloadStrategy.ALL,
    });

    if (model && app) {
      app.stage.addChild(model);

      const updateLive2dLayout = () => {
        if (!live2dContainer.value || !model) return;
        const width = live2dContainer.value.clientWidth;

        // Base scale and position
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
      };

      resizeObserver = new ResizeObserver(() => {
        updateLive2dLayout();
      });
      resizeObserver.observe(live2dContainer.value);
      updateLive2dLayout();

      // Add simple tap interaction using PIXI v7's event system
      model.eventMode = "static";
      model.on("pointerdown", () => {
        model?.expression("smile");
        model?.motion("Tap");
      });
      // Optionally just force it directly
      model?.expression("smile");
      model?.motion("Tap");
    }
  }
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
  if (model) {
    model.destroy();
  }
  if (app) {
    app.destroy(true, { children: true });
  }
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
