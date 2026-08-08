interface UpstreamHonorLevel {
  assetbundleName?: string;
  honorRarity?: string;
}

interface UpstreamHonor {
  id: number;
  groupId: number;
  honorRarity?: string;
  name: string;
  assetbundleName?: string;
  honorMissionType?: string;
  levels: UpstreamHonorLevel[];
}

interface UpstreamHonorGroup {
  id: number;
  honorType: string;
  backgroundAssetbundleName?: string;
}

interface UpstreamBondsHonor {
  id: number;
  bondsGroupId: number;
  gameCharacterUnitId1: number;
  gameCharacterUnitId2: number;
  honorRarity: string;
  name: string;
}

interface UpstreamBondsHonorWord {
  bondsGroupId: number;
  assetbundleName: string;
  name: string;
}

interface UpstreamGameCharacterUnit {
  id: number;
  gameCharacterId: number;
  colorCode: string;
}

export interface OtherTitleSummary {
  kind: "others";
  id: number;
  name: string;
  baseImageUrl: string;
  overlayImageUrl: string;
  frameImageUrl: string;
}

export interface KizunaTitleSummary {
  kind: "kizuna";
  id: number;
  name: string;
  wordName: string;
  background: string;
  characterImageUrls: [string, string];
  wordImageUrl: string;
  frameImageUrl: string;
}

export interface TitleCatalog {
  region: string;
  kizuna: KizunaTitleSummary[];
  others: OtherTitleSummary[];
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const VALID_REGIONS = new Set(["jp", "en", "cn", "tc", "kr"]);

const cache = new Map<string, { expiresAt: number; data: TitleCatalog }>();
const pendingRequests = new Map<string, Promise<TitleCatalog>>();

const getDatabaseSuffix = (region: string) => (region === "jp" ? "" : `-${region}`);
const getPublicAssetRoot = (region: string) => `/storage/sekai-${region}-assets`;

const fetchMasterData = async <T>(databaseRoot: string, fileName: string): Promise<T[]> => {
  const response = await fetch(`${databaseRoot}/${fileName}.json`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Failed to load ${fileName}: ${response.status}`);
  return response.json() as Promise<T[]>;
};

const colorWithAlpha = (color: string, alpha: string) =>
  /^#[0-9a-f]{6}$/i.test(color) ? `${color}${alpha}` : color;

const getKizunaBackground = (leftColor: string, rightColor: string) => {
  const left = colorWithAlpha(leftColor, "42");
  const right = colorWithAlpha(rightColor, "42");
  return `linear-gradient(110deg, ${left} 0 48%, ${right} 52% 100%)`;
};

const getFrameImageUrl = (rarity = "low") => {
  const frame = { low: 1, middle: 2, high: 3, highest: 4 }[rarity] ?? 1;
  return `/images/frame/frame_degree_m_${frame}.png`;
};

const getOtherPreview = (
  honor: UpstreamHonor,
  group: UpstreamHonorGroup | undefined,
  assetRoot: string,
) => {
  const honorBundle = honor.assetbundleName || honor.levels[0]?.assetbundleName;
  const baseBundle = group?.backgroundAssetbundleName || honorBundle;
  let baseImageUrl = "";
  let overlayImageUrl = "";

  if (baseBundle) {
    baseImageUrl =
      group?.honorType === "rank_match"
        ? `${assetRoot}/rank_live/honor/${baseBundle}/degree_main.webp`
        : `${assetRoot}/honor/${baseBundle}/degree_main.webp`;
  }

  if (group?.honorType === "rank_match" && honorBundle) {
    overlayImageUrl = `${assetRoot}/rank_live/honor/${honorBundle}/main.webp`;
  } else if (group?.honorType === "event" && honor.assetbundleName) {
    overlayImageUrl = `${assetRoot}/honor/${honor.assetbundleName}/rank_main.webp`;
  } else if (honor.honorMissionType && honorBundle) {
    overlayImageUrl = `${assetRoot}/honor/${honorBundle}/scroll.webp`;
  }

  return { baseImageUrl, overlayImageUrl };
};

const loadTitleCatalog = async (region: string): Promise<TitleCatalog> => {
  const databaseRoot = `https://sekai-world.github.io/sekai-master-db${getDatabaseSuffix(region)}-diff`;
  const assetRoot = getPublicAssetRoot(region);
  const [honors, groups, bondsHonors, bondsHonorWords, characterUnits] = await Promise.all([
    fetchMasterData<UpstreamHonor>(databaseRoot, "honors"),
    fetchMasterData<UpstreamHonorGroup>(databaseRoot, "honorGroups"),
    fetchMasterData<UpstreamBondsHonor>(databaseRoot, "bondsHonors"),
    fetchMasterData<UpstreamBondsHonorWord>(databaseRoot, "bondsHonorWords"),
    fetchMasterData<UpstreamGameCharacterUnit>(databaseRoot, "gameCharacterUnits"),
  ]);

  const groupMap = new Map(groups.map((group) => [group.id, group]));
  const wordMap = new Map<number, UpstreamBondsHonorWord>();
  for (const word of bondsHonorWords) {
    if (!wordMap.has(word.bondsGroupId)) wordMap.set(word.bondsGroupId, word);
  }
  const unitMap = new Map(characterUnits.map((unit) => [unit.id, unit]));

  const others = honors
    .map((honor): OtherTitleSummary => {
      const preview = getOtherPreview(honor, groupMap.get(honor.groupId), assetRoot);
      return {
        kind: "others",
        id: honor.id,
        name: honor.name,
        frameImageUrl: getFrameImageUrl(
          honor.honorRarity || honor.levels[0]?.honorRarity || "low",
        ),
        ...preview,
      };
    })
    .sort((left, right) => left.id - right.id);

  const kizuna = bondsHonors
    .map((honor): KizunaTitleSummary => {
      const word = wordMap.get(honor.bondsGroupId);
      const leftUnit = unitMap.get(honor.gameCharacterUnitId1);
      const rightUnit = unitMap.get(honor.gameCharacterUnitId2);
      const characterImageUrl = (characterId?: number) =>
        characterId
          ? `${assetRoot}/bonds_honor/character/chr_sd_${String(characterId).padStart(2, "0")}_01.webp`
          : "";

      return {
        kind: "kizuna",
        id: honor.id,
        name: honor.name,
        wordName: word?.name || "",
        background: getKizunaBackground(
          leftUnit?.colorCode || "#64748b",
          rightUnit?.colorCode || "#94a3b8",
        ),
        characterImageUrls: [
          characterImageUrl(leftUnit?.gameCharacterId),
          characterImageUrl(rightUnit?.gameCharacterId),
        ],
        wordImageUrl: word
          ? `${assetRoot}/bonds_honor/word/${word.assetbundleName}_01.webp`
          : "",
        frameImageUrl: getFrameImageUrl(honor.honorRarity),
      };
    })
    .sort((left, right) => left.id - right.id);

  return { region, kizuna, others };
};

const getCachedTitleCatalog = async (region: string): Promise<TitleCatalog> => {
  const cached = cache.get(region);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const pending = pendingRequests.get(region);
  if (pending) return pending;

  const request = loadTitleCatalog(region)
    .then((data) => {
      cache.set(region, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    })
    .finally(() => pendingRequests.delete(region));

  pendingRequests.set(region, request);
  return request;
};

export const isSupportedTitleRegion = (region: string) => VALID_REGIONS.has(region);

export const getTitleCatalog = async (region: string): Promise<TitleCatalog> => {
  try {
    return await getCachedTitleCatalog(region);
  } catch (error) {
    if (region === "jp") throw error;
    console.warn(`Failed to load ${region} titles, using JP data.`, error);
    return getCachedTitleCatalog("jp");
  }
};
