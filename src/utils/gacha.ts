export type GachaCategory = "gacha" | "event";

export interface GachaSummary {
  id: number;
  name: string;
  assetbundleName: string;
  startAt: number;
  endAt: number;
  category: GachaCategory;
  bannerUrl: string;
  logoUrl: string;
  backgroundUrl: string;
}

export const fetchLatestGachas = async (region: string): Promise<GachaSummary[]> => {
  const params = new URLSearchParams({ region });
  const response = await fetch(`/api/gachas/latest?${params.toString()}`);

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error || "The latest gachas and events could not be loaded.");
  }

  const gachas = (await response.json()) as GachaSummary[];
  if (
    !Array.isArray(gachas) ||
    gachas.length === 0 ||
    gachas.some((gacha) => gacha.category !== "gacha" && gacha.category !== "event")
  ) {
    throw new Error("The gacha service returned an invalid response.");
  }

  return gachas;
};
