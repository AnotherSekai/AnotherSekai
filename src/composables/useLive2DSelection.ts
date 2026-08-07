import { readonly, ref } from "vue";
import { getCookie, setCookie } from "@/utils/cookie";
import type { Live2DModelEntry } from "@/utils/live2d";

export interface Live2DSelection extends Live2DModelEntry {
  motion: string;
  expression: string;
}

export const DEFAULT_LIVE2D_MODEL: Live2DModelEntry = {
  modelName: "v2_21miku_night_t01",
  modelBase: "v2_21miku_night",
  modelPath: "v2/main/21_miku/v2_21miku_night",
  modelFile: "v2_21miku_night_t01.model3.json",
};

const savedModelPath = getCookie("sekai-live2d-model-path", DEFAULT_LIVE2D_MODEL.modelPath);
const savedModelPathParts = savedModelPath.split("/");

const selection = ref<Live2DSelection>({
  modelName: getCookie("sekai-live2d-model", DEFAULT_LIVE2D_MODEL.modelName),
  modelBase: getCookie(
    "sekai-live2d-model-base",
    savedModelPathParts[savedModelPathParts.length - 1] || DEFAULT_LIVE2D_MODEL.modelBase,
  ),
  modelPath: savedModelPath,
  modelFile: getCookie("sekai-live2d-model-file", DEFAULT_LIVE2D_MODEL.modelFile),
  motion: getCookie("sekai-live2d-motion", ""),
  expression: getCookie("sekai-live2d-expression", ""),
});

function applySelection(nextSelection: Live2DSelection) {
  setCookie("sekai-live2d-model", nextSelection.modelName);
  setCookie("sekai-live2d-model-base", nextSelection.modelBase);
  setCookie("sekai-live2d-model-path", nextSelection.modelPath);
  setCookie("sekai-live2d-model-file", nextSelection.modelFile);
  setCookie("sekai-live2d-motion", nextSelection.motion);
  setCookie("sekai-live2d-expression", nextSelection.expression);
  selection.value = { ...nextSelection };
}

export function useLive2DSelection() {
  return {
    selection: readonly(selection),
    applySelection,
  };
}
