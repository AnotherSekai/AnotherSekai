import { getDatabaseRoot, getPublicAssetRoot, type Region } from "../utils/region";

interface UpstreamVirtualLiveSchedule {
  id: number;
  seq: number;
  startAt: number;
  endAt: number;
  isAfterEvent: boolean;
}

interface UpstreamVirtualLiveBeginnerSchedule {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface UpstreamVirtualLiveCharacter {
  gameCharacterUnitId: number;
  seq?: number;
}

interface UpstreamVirtualLiveSetlist {
  id: number;
  seq: number;
  virtualLiveSetlistType: string;
  musicId?: number;
}

interface UpstreamVirtualLiveReward {
  resourceBoxId: number;
  virtualLiveType: string;
}

interface UpstreamVirtualLive {
  id: number;
  virtualLiveType: string;
  virtualLivePlatform: string;
  name: string;
  assetbundleName: string;
  startAt: number;
  endAt: number;
  virtualLiveSchedules: UpstreamVirtualLiveSchedule[];
  virtualLiveBeginnerSchedules: UpstreamVirtualLiveBeginnerSchedule[];
  virtualLiveCharacters: UpstreamVirtualLiveCharacter[];
  virtualLiveSetlists: UpstreamVirtualLiveSetlist[];
  virtualLiveRewards?: UpstreamVirtualLiveReward[];
}

interface UpstreamMusic {
  id: number;
  title: string;
  assetbundleName: string;
}

interface UpstreamGameCharacterUnit {
  id: number;
  gameCharacterId: number;
  colorCode: string;
}

interface UpstreamGameCharacter {
  id: number;
  firstName?: string;
  givenName: string;
  firstNameEnglish?: string;
  givenNameEnglish: string;
}

export type VirtualShowStatus = "live" | "upcoming" | "ended";

export interface VirtualShowSummary {
  id: number;
  name: string;
  type: string;
  startAt: number;
  endAt: number;
  nextScheduleAt: number | null;
  status: VirtualShowStatus;
  scheduleCount: number;
  castCount: number;
  cardImageUrl: string;
  bannerUrl: string;
}

export interface VirtualShowDetail extends VirtualShowSummary {
  platform: string;
  logoUrl: string;
  schedules: Array<{
    id: number;
    startAt: number;
    endAt: number;
    isAfterEvent: boolean;
  }>;
  recurringSchedules: Array<{
    id: number;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
  }>;
  cast: Array<{
    id: number;
    name: string;
    shortName: string;
    color: string;
  }>;
  setlist: Array<{
    id: number;
    sequence: number;
    type: string;
    title: string | null;
    jacketUrl: string | null;
  }>;
  rewardCount: number;
}

export interface VirtualShowPage {
  items: VirtualShowSummary[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

interface VirtualShowCatalog {
  region: Region;
  shows: UpstreamVirtualLive[];
  musicById: Map<number, UpstreamMusic>;
  characterUnitById: Map<number, UpstreamGameCharacterUnit>;
  characterById: Map<number, UpstreamGameCharacter>;
}

const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 20_000;
const cache = new Map<Region, { expiresAt: number; data: VirtualShowCatalog }>();
const pendingRequests = new Map<Region, Promise<VirtualShowCatalog>>();

const fetchMasterData = async <T>(databaseRoot: string, fileName: string): Promise<T[]> => {
  const response = await fetch(`${databaseRoot}/${fileName}.json`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Failed to load ${fileName}: ${response.status}`);
  return response.json() as Promise<T[]>;
};

const loadCatalog = async (region: Region): Promise<VirtualShowCatalog> => {
  const databaseRoot = getDatabaseRoot(region);
  const [shows, musics, characterUnits, characters] = await Promise.all([
    fetchMasterData<UpstreamVirtualLive>(databaseRoot, "virtualLives"),
    fetchMasterData<UpstreamMusic>(databaseRoot, "musics"),
    fetchMasterData<UpstreamGameCharacterUnit>(databaseRoot, "gameCharacterUnits"),
    fetchMasterData<UpstreamGameCharacter>(databaseRoot, "gameCharacters"),
  ]);

  return {
    region,
    shows,
    musicById: new Map(musics.map((music) => [music.id, music])),
    characterUnitById: new Map(characterUnits.map((unit) => [unit.id, unit])),
    characterById: new Map(characters.map((character) => [character.id, character])),
  };
};

const getCachedCatalog = async (region: Region): Promise<VirtualShowCatalog> => {
  const cached = cache.get(region);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const pending = pendingRequests.get(region);
  if (pending) return pending;

  const request = loadCatalog(region)
    .then((data) => {
      cache.set(region, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    })
    .finally(() => pendingRequests.delete(region));

  pendingRequests.set(region, request);
  return request;
};

const getCatalog = async (region: Region): Promise<VirtualShowCatalog> => {
  try {
    return await getCachedCatalog(region);
  } catch (error) {
    if (region === "jp") throw error;
    console.warn(`Failed to load ${region} virtual shows, using JP data.`, error);
    return getCachedCatalog("jp");
  }
};

const getStatus = (show: UpstreamVirtualLive, now: number): VirtualShowStatus => {
  if (
    show.virtualLiveSchedules.some(
      (schedule) => schedule.startAt <= now && schedule.endAt > now,
    )
  ) {
    return "live";
  }

  const hasUpcomingSchedule = show.virtualLiveSchedules.some(
    (schedule) => schedule.startAt > now,
  );
  if (show.startAt > now || hasUpcomingSchedule || show.endAt > now) return "upcoming";
  return "ended";
};

const getNextScheduleAt = (show: UpstreamVirtualLive, now: number) =>
  show.virtualLiveSchedules
    .filter((schedule) => schedule.endAt > now)
    .sort((left, right) => left.startAt - right.startAt)[0]?.startAt ?? null;

const toSummary = (
  show: UpstreamVirtualLive,
  region: Region,
  now: number,
): VirtualShowSummary => {
  const assetRoot = getPublicAssetRoot(region);

  return {
    id: show.id,
    name: show.name,
    type: show.virtualLiveType,
    startAt: show.startAt,
    endAt: show.endAt,
    nextScheduleAt: getNextScheduleAt(show, now),
    status: getStatus(show, now),
    scheduleCount: show.virtualLiveSchedules.length || show.virtualLiveBeginnerSchedules.length,
    castCount: show.virtualLiveCharacters.length,
    cardImageUrl: `${assetRoot}/virtual_live/select/banner/${show.assetbundleName}/${show.assetbundleName}.webp`,
    bannerUrl: `${assetRoot}/home/banner/banner_virtuallive${show.id}/banner_virtuallive${show.id}.webp`,
  };
};

export const getVirtualShows = async (
  region: Region,
  scope: "active" | "archive",
  page: number,
  pageSize: number,
): Promise<VirtualShowPage> => {
  const catalog = await getCatalog(region);
  const now = Date.now();
  const summaries = catalog.shows
    .filter((show) => show.virtualLiveType !== "beginner")
    .map((show) => toSummary(show, catalog.region, now))
    .filter((show) => (scope === "active" ? show.status !== "ended" : show.status === "ended"))
    .sort((left, right) => {
      if (scope === "archive") return right.endAt - left.endAt || right.id - left.id;
      const leftTime = left.nextScheduleAt ?? left.startAt;
      const rightTime = right.nextScheduleAt ?? right.startAt;
      return left.status === "live" && right.status !== "live"
        ? -1
        : right.status === "live" && left.status !== "live"
          ? 1
          : leftTime - rightTime;
    });
  const offset = (page - 1) * pageSize;
  const items = summaries.slice(offset, offset + pageSize);

  return {
    items,
    page,
    pageSize,
    total: summaries.length,
    hasMore: offset + items.length < summaries.length,
  };
};

export const getVirtualShowDetail = async (
  region: Region,
  id: number,
): Promise<VirtualShowDetail | null> => {
  const catalog = await getCatalog(region);
  const show = catalog.shows.find((candidate) => candidate.id === id);
  if (!show) return null;

  const assetRoot = getPublicAssetRoot(catalog.region);
  const cast = show.virtualLiveCharacters
    .slice()
    .sort((left, right) => (left.seq ?? 0) - (right.seq ?? 0))
    .flatMap((entry) => {
      const unit = catalog.characterUnitById.get(entry.gameCharacterUnitId);
      const character = unit ? catalog.characterById.get(unit.gameCharacterId) : undefined;
      if (!unit || !character) return [];

      const englishName = [character.firstNameEnglish, character.givenNameEnglish]
        .filter(Boolean)
        .join(" ");
      const localName = [character.firstName, character.givenName].filter(Boolean).join(" ");
      return [{
        id: character.id,
        name: englishName || localName,
        shortName: character.givenNameEnglish || character.givenName,
        color: unit.colorCode,
      }];
    });

  const setlist = show.virtualLiveSetlists
    .slice()
    .sort((left, right) => left.seq - right.seq)
    .map((entry) => {
      const music =
        entry.virtualLiveSetlistType === "music" && entry.musicId
          ? catalog.musicById.get(entry.musicId)
          : undefined;
      return {
        id: entry.id,
        sequence: entry.seq,
        type: entry.virtualLiveSetlistType,
        title: music?.title ?? null,
        jacketUrl: music
          ? `${assetRoot}/music/jacket/${music.assetbundleName}/${music.assetbundleName}.webp`
          : null,
      };
    });

  return {
    ...toSummary(show, catalog.region, Date.now()),
    platform: show.virtualLivePlatform,
    logoUrl: `${assetRoot}/virtual_live/select/banner/${show.assetbundleName}/${show.assetbundleName}.webp`,
    schedules: show.virtualLiveSchedules
      .slice()
      .sort((left, right) => left.startAt - right.startAt)
      .map(({ id: scheduleId, startAt, endAt, isAfterEvent }) => ({
        id: scheduleId,
        startAt,
        endAt,
        isAfterEvent,
      })),
    recurringSchedules: show.virtualLiveBeginnerSchedules.map(
      ({ id: scheduleId, dayOfWeek, startTime, endTime }) => ({
        id: scheduleId,
        dayOfWeek,
        startTime,
        endTime,
      }),
    ),
    cast,
    setlist,
    rewardCount: show.virtualLiveRewards?.length ?? 0,
  };
};
