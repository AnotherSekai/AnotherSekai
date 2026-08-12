interface UpstreamMusic {
  id: number;
  title: string;
  lyricist: string;
  composer: string;
  assetbundleName: string;
}

interface UpstreamMusicTag {
  musicId: number;
  musicTag: string;
}

interface UpstreamMusicDifficulty {
  musicId: number;
  musicDifficulty: string;
  playLevel: number;
}

interface UpstreamMusicVocal {
  musicId: number;
  assetbundleName: string;
}

export interface MusicSummary {
  id: number;
  title: string;
  artist: string;
  cover: string;
  audioSrc: string | null;
  tags: string[];
  difficulties: Record<string, number>;
  searchText: string;
}

const CACHE_TTL_MS = 30 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const VALID_REGIONS = new Set(["jp", "en", "cn", "tc", "kr"]);

// These songs only exist on the indicated regional asset server. Other localized
// catalogs still use the JP audio assets, matching sekai-viewer's music resolver.
const REGION_EXCLUSIVE_MUSIC_IDS: Readonly<Record<string, ReadonlySet<number>>> = {
  en: new Set([
    371, 387, 419, 420, 445, 453, 459, 464, 479, 502, 514, 528, 535, 552, 563, 568, 598,
    599, 602, 609, 640, 657, 673, 690, 694, 701, 725, 736, 762, 786,
  ]),
  kr: new Set([
    10001, 10002, 371, 387, 419, 420, 453, 459, 464, 10003, 10004, 10005, 10006, 10007,
    10008, 694, 10009, 10010,
  ]),
  tc: new Set([371, 387, 419, 420, 453, 459, 464, 694, 11012]),
  cn: new Set([
    76, 276, 371, 376, 387, 419, 420, 453, 464, 476, 576, 10001, 10002, 11001, 11002,
    11003, 11004, 11005, 11006, 11007, 11008, 11009, 11010, 11011, 11012, 11013, 11014,
    11015, 11016, 11017, 11018, 11019,
  ]),
};

const cache = new Map<string, { expiresAt: number; data: MusicSummary[] }>();
const pendingRequests = new Map<string, Promise<MusicSummary[]>>();

const getDatabaseSuffix = (region: string) => (region === "jp" ? "" : `-${region}`);
const getPublicAssetRoot = (region: string) => `/storage/sekai-${region}-assets`;

const fetchMasterData = async <T>(databaseRoot: string, fileName: string): Promise<T[]> => {
  const response = await fetch(`${databaseRoot}/${fileName}.json`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Failed to load ${fileName}: ${response.status}`);

  const data: unknown = await response.json();
  if (!Array.isArray(data)) throw new Error(`Invalid ${fileName} response.`);
  return data as T[];
};

const getAudioAssetRegion = (musicId: number, region: string) =>
  REGION_EXCLUSIVE_MUSIC_IDS[region]?.has(musicId) ? region : "jp";

export const getMusicAudioUrl = (
  musicId: number,
  vocalAssetbundleName: string | undefined,
  region: string,
) => {
  if (!vocalAssetbundleName) return null;

  const assetRoot = getPublicAssetRoot(getAudioAssetRegion(musicId, region));
  return `${assetRoot}/music/short/${vocalAssetbundleName}/${vocalAssetbundleName}_short.mp3`;
};

const loadMusicCatalog = async (region: string): Promise<MusicSummary[]> => {
  const databaseRoot = `https://sekai-world.github.io/sekai-master-db${getDatabaseSuffix(region)}-diff`;
  const [musics, tags, difficulties, vocals] = await Promise.all([
    fetchMasterData<UpstreamMusic>(databaseRoot, "musics"),
    fetchMasterData<UpstreamMusicTag>(databaseRoot, "musicTags"),
    fetchMasterData<UpstreamMusicDifficulty>(databaseRoot, "musicDifficulties"),
    fetchMasterData<UpstreamMusicVocal>(databaseRoot, "musicVocals"),
  ]);

  const tagsByMusicId = new Map<number, string[]>();
  for (const tag of tags) {
    const musicTags = tagsByMusicId.get(tag.musicId) ?? [];
    musicTags.push(tag.musicTag);
    tagsByMusicId.set(tag.musicId, musicTags);
  }

  const difficultiesByMusicId = new Map<number, Record<string, number>>();
  for (const difficulty of difficulties) {
    const musicDifficulties = difficultiesByMusicId.get(difficulty.musicId) ?? {};
    musicDifficulties[difficulty.musicDifficulty] = difficulty.playLevel;
    difficultiesByMusicId.set(difficulty.musicId, musicDifficulties);
  }

  // Keep the first vocal in upstream order, as sekai-viewer's default vocal selector does.
  const vocalBundleByMusicId = new Map<number, string>();
  for (const vocal of vocals) {
    if (!vocalBundleByMusicId.has(vocal.musicId) && vocal.assetbundleName) {
      vocalBundleByMusicId.set(vocal.musicId, vocal.assetbundleName);
    }
  }

  const assetRoot = getPublicAssetRoot(region);
  return musics.map((music) => {
    const artist =
      music.composer !== music.lyricist
        ? `${music.composer} / ${music.lyricist}`
        : music.composer;

    return {
      id: music.id,
      title: music.title,
      artist,
      cover: `${assetRoot}/music/jacket/${music.assetbundleName}/${music.assetbundleName}.webp`,
      audioSrc: getMusicAudioUrl(music.id, vocalBundleByMusicId.get(music.id), region),
      tags: tagsByMusicId.get(music.id) ?? [],
      difficulties: difficultiesByMusicId.get(music.id) ?? {},
      searchText: `${music.title} ${artist}`.toLowerCase(),
    };
  });
};

const getCachedMusicCatalog = async (region: string): Promise<MusicSummary[]> => {
  const cached = cache.get(region);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const pending = pendingRequests.get(region);
  if (pending) return pending;

  const request = loadMusicCatalog(region)
    .then((data) => {
      cache.set(region, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    })
    .finally(() => pendingRequests.delete(region));

  pendingRequests.set(region, request);
  return request;
};

export const isSupportedMusicRegion = (region: string) => VALID_REGIONS.has(region);

export const getMusicCatalog = async (region: string): Promise<MusicSummary[]> => {
  try {
    return await getCachedMusicCatalog(region);
  } catch (error) {
    if (region === "jp") throw error;
    console.warn(`Failed to load ${region} music, using JP data.`, error);
    return getCachedMusicCatalog("jp");
  }
};
