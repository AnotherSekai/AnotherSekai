export const LIVE2D_ASSET_ROOT = "/storage/sekai-live2d-assets/live2d";

export interface Live2DModelEntry {
  modelName: string;
  modelBase: string;
  modelPath: string;
  modelFile: string;
}

export interface Live2DMotionDefinition {
  Name: string;
  File: string;
  FadeInTime: number;
  FadeOutTime: number;
}

export interface Live2DModelOptions {
  motions: Live2DMotionDefinition[];
  expressions: Live2DMotionDefinition[];
}

interface BuildMotionData {
  motions?: string[];
  expressions?: string[];
}

interface BuildModelData {
  AdditionalMotionData?: unknown[];
}

interface Live2DFileReferences {
  Moc: string;
  Textures: string[];
  Physics?: string;
  Pose?: string;
  DisplayInfo?: string;
  Motions?: Record<string, Live2DMotionDefinition[]>;
  Expressions?: unknown;
  [key: string]: unknown;
}

export interface Live2DModelData {
  FileReferences: Live2DFileReferences;
  url?: string;
  [key: string]: unknown;
}

const optionCache = new Map<string, Promise<Live2DModelOptions>>();

function assetUrl(path: string): string {
  return `${LIVE2D_ASSET_ROOT}/${path.replace(/^\/+/, "")}`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}

async function fetchAssetJson<T>(path: string): Promise<T> {
  const response = await fetch(assetUrl(path));
  if (response.ok) return response.json() as Promise<T>;

  const lowercasePath = path.toLowerCase();
  if (response.status !== 404 || lowercasePath === path) {
    throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
  }

  return fetchJson<T>(assetUrl(lowercasePath));
}

async function findAsset(path: string): Promise<string | null> {
  const candidates = [path];
  const lowercasePath = path.toLowerCase();
  if (lowercasePath !== path) candidates.push(lowercasePath);

  for (const candidate of candidates) {
    try {
      const response = await fetch(assetUrl(candidate), { method: "HEAD" });
      if (response.ok) return candidate;
    } catch {
      // Try the next candidate. A missing optional motion file is expected.
    }
  }

  return null;
}

const modelNameToMotionBaseName: Array<[
  RegExp,
  (modelName: string) => string,
]> = [
  [/^v2_clb\d{2}_.*$/, (modelName) => modelName.replace(/^v2_clb\d{2}_/, "v2_")],
  [
    /(.*)_back(\d{2})?$/,
    (modelName) => {
      const match = modelName.match(/(.*)_back(\d{2})?$/);
      return match ? `${match[1]?.split("_").slice(0, 2).join("_")}_back` : modelName;
    },
  ],
  [/(.*)\d{2}$/, (modelName) => modelName.replace(/\d{2}$/, "")],
];

async function resolveBaseMotionData(
  model: Live2DModelEntry,
): Promise<{ data: BuildMotionData; basePath: string }> {
  let modelBaseName = model.modelBase;
  let modelDirectory = model.modelPath.split("/").slice(0, -1).join("/");
  const normalizedDirectory = modelDirectory.toLowerCase();

  if (normalizedDirectory.includes("v2/collabo/21_miku")) {
    modelDirectory = modelDirectory.replace("collabo", "main");
  } else if (normalizedDirectory.includes("v2/collabo/egg")) {
    modelDirectory = modelDirectory.split("/").slice(0, -1).join("/");
  }

  const motionDataPath = (baseName: string) =>
    `motion/${modelDirectory}/${baseName}_motion_base/BuildMotionData.json`;

  let resolvedPath = await findAsset(motionDataPath(modelBaseName));

  if (!resolvedPath) {
    for (const [pattern, transform] of modelNameToMotionBaseName) {
      if (!pattern.test(modelBaseName)) continue;
      modelBaseName = transform(modelBaseName);
      resolvedPath = await findAsset(motionDataPath(modelBaseName));
      break;
    }
  }

  while (!resolvedPath && modelBaseName.split("_").length > 1) {
    modelBaseName = modelBaseName.split("_").slice(0, -1).join("_");
    resolvedPath = await findAsset(motionDataPath(modelBaseName));
  }

  if (!resolvedPath) {
    return { data: { motions: [], expressions: [] }, basePath: "" };
  }

  return {
    data: await fetchAssetJson<BuildMotionData>(resolvedPath),
    basePath: `motion/${modelDirectory}/${modelBaseName}_motion_base`,
  };
}

async function loadAdditionalMotionData(model: Live2DModelEntry): Promise<BuildMotionData> {
  try {
    const buildData = await fetchAssetJson<BuildModelData>(
      `model/${model.modelPath}/buildmodeldata.asset`,
    );
    if (!buildData.AdditionalMotionData?.length) return {};

    const path = `model/${model.modelPath}/motions/BuildMotionData.json`;
    const resolvedPath = await findAsset(path);
    return resolvedPath ? await fetchAssetJson<BuildMotionData>(resolvedPath) : {};
  } catch (error) {
    console.warn(`Failed to load additional Live2D motions for ${model.modelName}`, error);
    return {};
  }
}

async function resolveModelOptions(model: Live2DModelEntry): Promise<Live2DModelOptions> {
  const [{ data, basePath }, additional] = await Promise.all([
    resolveBaseMotionData(model),
    loadAdditionalMotionData(model),
  ]);

  const motions = (data.motions ?? []).map((name) => ({
    Name: name,
    File: assetUrl(`${basePath}/motion/${name}.motion3.json`),
    FadeInTime: 1,
    FadeOutTime: 1,
  }));

  for (const name of additional.motions ?? []) {
    motions.push({
      Name: `${name}-additional`,
      File: assetUrl(`model/${model.modelPath}/motions/${name}.motion3.json`),
      FadeInTime: 1,
      FadeOutTime: 1,
    });
  }

  const expressions = (data.expressions ?? []).map((name) => ({
    Name: name,
    File: assetUrl(`${basePath}/facial/${name}.motion3.json`),
    FadeInTime: 1,
    FadeOutTime: 1,
  }));

  return { motions, expressions };
}

export function loadLive2DModelOptions(model: Live2DModelEntry): Promise<Live2DModelOptions> {
  const cacheKey = `${model.modelPath}/${model.modelFile}`;
  const cached = optionCache.get(cacheKey);
  if (cached) return cached;

  const options = resolveModelOptions(model).catch((error) => {
    optionCache.delete(cacheKey);
    throw error;
  });
  optionCache.set(cacheKey, options);
  return options;
}

export async function loadLive2DModelData(
  model: Live2DModelEntry,
): Promise<{ data: Live2DModelData; options: Live2DModelOptions }> {
  const [data, options] = await Promise.all([
    fetchAssetJson<Live2DModelData>(`model/${model.modelPath}/${model.modelFile}`),
    loadLive2DModelOptions(model),
  ]);

  data.url = assetUrl(`model/${model.modelPath}/`);
  data.FileReferences.Motions = {
    Motion: options.motions,
    Expression: options.expressions,
  };
  data.FileReferences.Expressions = {};

  return { data, options };
}
