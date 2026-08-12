import {
  getAssetOrigin,
  getDatabaseRoot,
  getPublicAssetRoot,
  type Region,
} from "../utils/region";

interface UpstreamGacha {
  id: number;
  name: string;
  assetbundleName: string;
  startAt: number;
  endAt: number;
}

export interface GachaSummary extends UpstreamGacha {
  bannerUrl: string;
  logoUrl: string;
  backgroundUrl: string;
}

const LATEST_GACHA_LIMIT = 10;
const GACHA_TAIL_BYTES = 1024 * 1024;
const PARSE_CANDIDATE_LIMIT = 32;
const CACHE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15_000;
const cache = new Map<Region, { expiresAt: number; data: GachaSummary[] }>();
const pendingRequests = new Map<Region, Promise<GachaSummary[]>>();

const parseObjectsFromJsonTail = (source: string, limit: number): unknown[] => {
  const records: unknown[] = [];
  let objectDepth = 0;
  let objectEnd = -1;
  let inString = false;

  for (let index = source.length - 1; index >= 0 && records.length < limit; index -= 1) {
    const character = source[index];

    if (character === '"') {
      let slashCount = 0;
      for (let slashIndex = index - 1; slashIndex >= 0 && source[slashIndex] === "\\"; slashIndex -= 1) {
        slashCount += 1;
      }
      if (slashCount % 2 === 0) inString = !inString;
      continue;
    }

    if (inString) continue;

    if (character === "}") {
      if (objectDepth === 0) objectEnd = index + 1;
      objectDepth += 1;
      continue;
    }

    if (character !== "{") continue;

    objectDepth -= 1;
    if (objectDepth !== 0 || objectEnd <= index) continue;

    try {
      records.push(JSON.parse(source.slice(index, objectEnd)));
    } catch {
      // The byte range can begin in the middle of a record. Ignore that fragment.
    }
    objectEnd = -1;
  }

  return records;
};

const isUpstreamGacha = (value: unknown): value is UpstreamGacha => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<UpstreamGacha>;

  return (
    typeof candidate.id === "number" &&
    typeof candidate.name === "string" &&
    typeof candidate.assetbundleName === "string" &&
    typeof candidate.startAt === "number" &&
    typeof candidate.endAt === "number"
  );
};

const fetchGachaCatalogTail = async (region: Region) => {
  const response = await fetch(
    `${getDatabaseRoot(region)}/gachas.json`,
    {
      headers: {
        Range: `bytes=-${GACHA_TAIL_BYTES}`,
        "Accept-Encoding": "identity",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    },
  );

  if (response.status !== 206 || !response.headers.get("content-range")?.startsWith("bytes ")) {
    await response.body?.cancel();
    throw new Error("The upstream source did not honor the bounded gacha request.");
  }

  return response.text();
};

const fetchBackgroundUrl = async (gacha: UpstreamGacha, region: Region) => {
  const prefix = `gacha/${gacha.assetbundleName}/screen/texture/`;
  const params = new URLSearchParams({
    "list-type": "2",
    "max-keys": "100",
    prefix,
  });
  const response = await fetch(`${getAssetOrigin(region)}/?${params.toString()}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!response.ok) return "";

  const xml = await response.text();
  const keys = Array.from(xml.matchAll(/<Key>([^<]+)<\/Key>/g), (match) => match[1] ?? "");
  const backgroundKey = keys.find((key) => key.includes("/bg_gacha") && key.endsWith(".webp"));

  return backgroundKey ? `${getPublicAssetRoot(region)}/${backgroundKey}` : "";
};

const loadLatestGachas = async (region: Region): Promise<GachaSummary[]> => {
  const now = Date.now();
  const source = await fetchGachaCatalogTail(region);
  const latest = parseObjectsFromJsonTail(source, PARSE_CANDIDATE_LIMIT)
    .filter(isUpstreamGacha)
    .filter((gacha) => gacha.startAt <= now)
    .sort((left, right) => right.startAt - left.startAt || right.id - left.id)
    .slice(0, LATEST_GACHA_LIMIT);

  if (latest.length < LATEST_GACHA_LIMIT) {
    throw new Error("The bounded response did not contain ten recent gachas.");
  }

  return Promise.all(
    latest.map(async (gacha) => {
      const assetRoot = getPublicAssetRoot(region);
      const bannerUrl = `${assetRoot}/home/banner/banner_gacha${gacha.id}/banner_gacha${gacha.id}.webp`;
      const backgroundUrl = await fetchBackgroundUrl(gacha, region).catch(() => "");

      return {
        id: gacha.id,
        name: gacha.name,
        assetbundleName: gacha.assetbundleName,
        startAt: gacha.startAt,
        endAt: gacha.endAt,
        bannerUrl,
        logoUrl: `${assetRoot}/gacha/${gacha.assetbundleName}/logo/logo.webp`,
        backgroundUrl: backgroundUrl || bannerUrl,
      };
    }),
  );
};

export const getLatestGachas = async (region: Region): Promise<GachaSummary[]> => {
  const cached = cache.get(region);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  const pending = pendingRequests.get(region);
  if (pending) return pending;

  const request = loadLatestGachas(region)
    .then((data) => {
      cache.set(region, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      return data;
    })
    .finally(() => pendingRequests.delete(region));

  pendingRequests.set(region, request);
  return request;
};
