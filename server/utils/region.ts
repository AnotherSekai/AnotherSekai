export const REGIONS = ["jp", "en", "cn", "tc", "kr"] as const;

export type Region = (typeof REGIONS)[number];

export const DEFAULT_REGION: Region = "jp";

const regionSet = new Set<string>(REGIONS);

const REGION_ALIASES: Readonly<Record<string, Region>> = {
  tw: "tc",
};

export const isRegion = (value: string): value is Region => regionSet.has(value);

export const normalizeRegion = (value: string | null): Region | null => {
  if (!value) return DEFAULT_REGION;
  if (isRegion(value)) return value;
  return REGION_ALIASES[value] ?? null;
};

export const getDatabaseRoot = (region: Region) =>
  `https://sekai-world.github.io/sekai-master-db${region === "jp" ? "" : `-${region}`}-diff`;

export const getAssetOrigin = (region: Region) =>
  `https://storage.sekai.best/sekai-${region}-assets`;

export const getPublicAssetRoot = (region: Region) => `/storage/sekai-${region}-assets`;
